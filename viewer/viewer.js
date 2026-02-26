// Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = '../vendor/pdf.worker.min.js';

// State
let pdfDoc = null;
let currentScale = 1.0;
let pageWrappers = [];
let annotations = []; // [{ pageNum, pdfX, pdfY, text, element, color, size }]
let drawnPaths = []; // [{ pageNum, color, size, points: [[pdfX, pdfY], ...] }]
let isAddingText = false;
let isDrawingMode = false;
let currentPdfBytes = null;

// DOM Elements
const fileUpload = document.getElementById('file-upload');
const emptyState = document.getElementById('empty-state');
const viewerContainer = document.getElementById('viewer-container');
const pagesContainer = document.getElementById('pages-container');
const toolsPanel = document.getElementById('tools');
const actionsPanel = document.getElementById('actions');

const pageNumSpan = document.getElementById('page-num');
const pageCountSpan = document.getElementById('page-count');
const zoomValSpan = document.getElementById('zoom-val');

// Event Listeners
fileUpload.addEventListener('change', handleFileSelect);

document.getElementById('btn-text').addEventListener('click', toggleTextMode);
document.getElementById('btn-draw').addEventListener('click', toggleDrawMode);
document.getElementById('zoom-in').addEventListener('click', () => zoom(0.2));
document.getElementById('zoom-out').addEventListener('click', () => zoom(-0.2));
document.getElementById('btn-save').addEventListener('click', savePdf);

document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
});

// Initialize Intersection Observer for lazy rendering to keep it lite
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const wrapper = entry.target;
        const pageNum = parseInt(wrapper.dataset.pageNum);

        if (entry.isIntersecting) {
            renderPageContext(wrapper, pageNum);
        } else {
            // Clean up offscreen canvases to save memory
            cleanOffscreenContext(wrapper);
        }
    });
}, {
    root: viewerContainer,
    rootMargin: '100% 0px', // Preload slightly offscreen
    threshold: 0
});

async function loadPdfFromBytes(bytes) {
    if (pdfDoc) {
        pdfDoc.destroy();
        pagesContainer.innerHTML = '';
        pageWrappers = [];
        annotations = [];
        drawnPaths = [];
    }

    emptyState.style.display = 'none';
    toolsPanel.style.display = 'flex';
    actionsPanel.style.display = 'flex';
    viewerContainer.style.display = 'block';

    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });

    try {
        pdfDoc = await loadingTask.promise;
        pageCountSpan.textContent = pdfDoc.numPages;
        pageNumSpan.textContent = 1;

        // Create page placeholders
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            await createPagePlaceholder(i);
        }
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Failed to load PDF.');
    }
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    currentPdfBytes = new Uint8Array(arrayBuffer); // Keep original bytes for saving later

    await loadPdfFromBytes(currentPdfBytes);
}

// Intercept file URL from background.js
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fileUrl = urlParams.get('file');

    if (fileUrl) {
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error("Network response was not ok");
            const arrayBuffer = await response.arrayBuffer();
            currentPdfBytes = new Uint8Array(arrayBuffer);
            await loadPdfFromBytes(currentPdfBytes);
        } catch (error) {
            console.error('Error fetching PDF:', error);
            if (fileUrl.startsWith('file://')) {
                alert("Could not load local PDF.\n\nPlease go to chrome://extensions/for this extension and check 'Allow access to file URLs' to enable drag-and-drop support, then refresh this page.");
            } else {
                alert("Failed to load PDF from URL. It may be protected by CORS.");
            }
        }
    }
});

async function createPagePlaceholder(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: currentScale });

    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-wrapper unloaded';
    wrapper.dataset.pageNum = pageNum;

    // Set explicit width/height to maintain scroll position when content is unloaded
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    // Add annotation layer
    const annLayer = document.createElement('div');
    annLayer.className = 'annotation-layer';
    wrapper.appendChild(annLayer);

    // Add drawing layer
    const drawingLayer = document.createElement('canvas');
    drawingLayer.className = 'drawing-layer';
    drawingLayer.width = viewport.width;
    drawingLayer.height = viewport.height;
    wrapper.appendChild(drawingLayer);

    pagesContainer.appendChild(wrapper);
    pageWrappers.push({ wrapper, page, viewport });

    // Track intersection
    observer.observe(wrapper);

    setupDrawingEvents(drawingLayer, wrapper, pageNum);
}

function setupDrawingEvents(drawingLayer, wrapper, pageNum) {
    let isMouseDown = false;
    let ctx = null;
    let activePath = null;

    drawingLayer.addEventListener('mousedown', (e) => {
        if (!isDrawingMode) return;
        isMouseDown = true;

        ctx = drawingLayer.getContext('2d');
        const color = document.getElementById('draw-color').value;
        const size = parseInt(document.getElementById('draw-size').value, 10);

        ctx.strokeStyle = color;
        ctx.lineWidth = size * currentScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const rect = drawingLayer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ensure we scale drawn points internally to exactly what the PDF thinks is 1.0 scale
        const pdfX = x / currentScale;
        const pdfY = y / currentScale;

        ctx.beginPath();
        ctx.moveTo(x, y);

        activePath = {
            pageNum,
            color,
            size,
            points: [[pdfX, pdfY]]
        };
    });

    drawingLayer.addEventListener('mousemove', (e) => {
        if (!isDrawingMode || !isMouseDown || !ctx || !activePath) return;
        const rect = drawingLayer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();

        const pdfX = x / currentScale;
        const pdfY = y / currentScale;
        activePath.points.push([pdfX, pdfY]);
    });

    const finishDrawing = () => {
        if (!isMouseDown) return;
        isMouseDown = false;
        if (activePath && activePath.points.length > 1) {
            drawnPaths.push(activePath);
        }
        activePath = null;
    };

    drawingLayer.addEventListener('mouseup', finishDrawing);
    drawingLayer.addEventListener('mouseleave', finishDrawing);
}

function redrawPageDrawingLayer(pageNum) {
    const data = pageWrappers[pageNum - 1];
    const drawingLayer = data.wrapper.querySelector('.drawing-layer');
    if (!drawingLayer) return;

    // Make sure the canvas internal resolution matches its display size
    drawingLayer.width = data.wrapper.clientWidth;
    drawingLayer.height = data.wrapper.clientHeight;

    const ctx = drawingLayer.getContext('2d');
    ctx.clearRect(0, 0, drawingLayer.width, drawingLayer.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const paths = drawnPaths.filter(p => p.pageNum === pageNum);
    for (const p of paths) {
        if (p.points.length < 2) continue;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * currentScale;
        ctx.beginPath();
        ctx.moveTo(p.points[0][0] * currentScale, p.points[0][1] * currentScale);
        for (let i = 1; i < p.points.length; i++) {
            ctx.lineTo(p.points[i][0] * currentScale, p.points[i][1] * currentScale);
        }
        ctx.stroke();
    }
}

async function renderPageContext(wrapper, pageNum) {
    if (!wrapper.classList.contains('unloaded')) return; // Already rendered

    const pageData = pageWrappers[pageNum - 1];
    const viewport = pageData.page.getViewport({ scale: currentScale });

    wrapper.classList.remove('unloaded');

    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page-canvas';
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Insert behind annotation layer
    wrapper.insertBefore(canvas, wrapper.firstChild);

    const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
    };

    try {
        await pageData.page.render(renderContext).promise;
    } catch (e) {
        // Handle rendering cancelled due to scroling too fast
    }

    redrawPageDrawingLayer(pageNum);
}

function cleanOffscreenContext(wrapper) {
    if (wrapper.classList.contains('unloaded')) return;

    const canvas = wrapper.querySelector('canvas.pdf-page-canvas');
    if (canvas) {
        // Free GPU/Memory used by canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvas.remove();
    }

    const drawingLayer = wrapper.querySelector('.drawing-layer');
    if (drawingLayer) {
        drawingLayer.width = 0; // Clean its memory too until visible
        drawingLayer.height = 0;
    }

    wrapper.classList.add('unloaded');
}

function zoom(delta) {
    const newScale = Math.max(0.5, Math.min(3.0, currentScale + delta));
    if (newScale === currentScale) return;

    currentScale = newScale;
    zoomValSpan.textContent = `${Math.round(currentScale * 100)}%`;

    // Update all placeholders
    pageWrappers.forEach((data, index) => {
        const viewport = data.page.getViewport({ scale: currentScale });
        data.wrapper.style.width = `${viewport.width}px`;
        data.wrapper.style.height = `${viewport.height}px`;

        // Force re-render of intersecting pages
        cleanOffscreenContext(data.wrapper);

        // Reposition annotations
        updateAnnotationPositions(index + 1, viewport);
        redrawPageDrawingLayer(index + 1);
    });
}

// Annotation UI Logic
function toggleTextMode() {
    isAddingText = !isAddingText;
    isDrawingMode = false;
    updateToolUI();
}

function toggleDrawMode() {
    isDrawingMode = !isDrawingMode;
    isAddingText = false;
    updateToolUI();
}

function updateToolUI() {
    const btnText = document.getElementById('btn-text');
    const btnDraw = document.getElementById('btn-draw');

    btnText.style.backgroundColor = isAddingText ? 'var(--accent-color)' : '';
    btnText.style.color = isAddingText ? 'white' : '';
    document.getElementById('tool-text-options').style.display = isAddingText ? 'flex' : 'none';

    btnDraw.style.backgroundColor = isDrawingMode ? 'var(--accent-color)' : '';
    btnDraw.style.color = isDrawingMode ? 'white' : '';
    document.getElementById('tool-draw-options').style.display = isDrawingMode ? 'flex' : 'none';

    viewerContainer.style.cursor = isAddingText ? 'crosshair' : (isDrawingMode ? 'crosshair' : 'default');

    pageWrappers.forEach(item => {
        if (isDrawingMode) item.wrapper.classList.add('drawing-mode');
        else item.wrapper.classList.remove('drawing-mode');

        if (isAddingText) item.wrapper.addEventListener('click', handlePageClickForText);
        else item.wrapper.removeEventListener('click', handlePageClickForText);
    });
}

function handlePageClickForText(e) {
    if (!isAddingText) return;

    // Don't trigger if clicking on an existing annotation
    if (e.target.classList.contains('text-annotation')) return;

    const wrapper = e.currentTarget;
    const pageNum = parseInt(wrapper.dataset.pageNum);
    const annLayer = wrapper.querySelector('.annotation-layer');

    const rect = annLayer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel coords to PDF coords based on current scale
    const pdfX = x / currentScale;
    const pdfY = y / currentScale;

    createTextAnnotation(pageNum, pdfX, pdfY, "", annLayer, true);

    // Auto-disable text mode after one click for better UX
    toggleTextMode();
}

function createTextAnnotation(pageNum, pdfX, pdfY, initialText, layer, isEditing) {
    const el = document.createElement('div');
    el.className = 'text-annotation' + (isEditing ? ' editing' : '');
    el.contentEditable = true;
    el.innerText = initialText;

    const color = document.getElementById('text-color').value;
    const size = parseInt(document.getElementById('text-size').value, 10);

    // Position based on scale
    el.style.left = `${pdfX * currentScale}px`;
    el.style.top = `${pdfY * currentScale}px`;
    el.style.fontSize = `${size * currentScale}px`;
    el.style.color = color;

    layer.appendChild(el);
    if (isEditing) el.focus();

    const ann = { pageNum, pdfX, pdfY, text: initialText, element: el, color, size };
    annotations.push(ann);

    // Update data on blur
    el.addEventListener('blur', () => {
        el.classList.remove('editing');
        ann.text = el.innerText.trim();
        // Remove if empty
        if (!ann.text) {
            el.remove();
            annotations = annotations.filter(a => a !== ann);
        }
    });

    el.addEventListener('mousedown', (e) => {
        if (el.classList.contains('editing')) return;
        el.classList.add('editing');
        el.focus();
    });
}

function updateAnnotationPositions(pageNum, viewport) {
    annotations.filter(a => a.pageNum === pageNum).forEach(ann => {
        ann.element.style.left = `${ann.pdfX * currentScale}px`;
        ann.element.style.top = `${ann.pdfY * currentScale}px`;
        ann.element.style.fontSize = `${ann.size * currentScale}px`;
    });
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return PDFLib.rgb(r, g, b);
}

// Track scrolling to update page number
viewerContainer.addEventListener('scroll', () => {
    // Find centered page roughly
    const centerLine = viewerContainer.scrollTop + viewerContainer.clientHeight / 2;

    for (let i = 0; i < pageWrappers.length; i++) {
        const top = pageWrappers[i].wrapper.offsetTop;
        const h = pageWrappers[i].wrapper.offsetHeight;
        if (centerLine >= top && centerLine <= top + h) {
            pageNumSpan.textContent = i + 1;
            break;
        }
    }
});

// Save PDF
async function savePdf() {
    if (!currentPdfBytes) return;

    const fileName = prompt("Enter a name for the saved PDF:", "annotated.pdf");
    if (!fileName) return; // User cancelled

    try {
        document.getElementById('btn-save').textContent = 'Saving...';

        // Use ignoreEncryption just in case some PDFs strictly forbid modification flags
        const pdfDocMod = await PDFLib.PDFDocument.load(currentPdfBytes, { ignoreEncryption: true });
        const pages = pdfDocMod.getPages();
        const font = await pdfDocMod.embedFont(PDFLib.StandardFonts.Helvetica);

        // Apply text annotations
        for (const ann of annotations) {
            if (!ann.text) continue;

            const page = pages[ann.pageNum - 1];
            const { height } = page.getSize();

            const pdfYBottomLeft = height - ann.pdfY - (ann.size); // Approximate text baseline

            page.drawText(ann.text, {
                x: ann.pdfX,
                y: pdfYBottomLeft,
                size: ann.size,
                font: font,
                color: hexToRgb(ann.color),
            });
        }

        // Apply drawn paths
        for (const p of drawnPaths) {
            if (p.points.length < 2) continue;
            const page = pages[p.pageNum - 1];
            const { height } = page.getSize();

            for (let i = 0; i < p.points.length - 1; i++) {
                const pdfX1 = p.points[i][0];
                const pdfY1 = height - p.points[i][1];
                const pdfX2 = p.points[i + 1][0];
                const pdfY2 = height - p.points[i + 1][1];

                page.drawLine({
                    start: { x: pdfX1, y: pdfY1 },
                    end: { x: pdfX2, y: pdfY2 },
                    color: hexToRgb(p.color),
                    thickness: p.size,
                });
            }
        }

        const pdfBytes = await pdfDocMod.save();

        // Trigger download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.endsWith('.pdf') ? fileName : fileName + '.pdf';
        document.body.appendChild(a);
        a.click();

        // Cleanup URLs to save memory
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
            document.getElementById('btn-save').innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save PDF
            `;
        }, 100);

    } catch (e) {
        console.error("Failed to save:", e);
        alert("Failed to save PDF: " + e.message);
        document.getElementById('btn-save').innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Save PDF
        `;
    }
}
