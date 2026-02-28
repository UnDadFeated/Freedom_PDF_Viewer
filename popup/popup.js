document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('open-viewer').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('pdfjs/web/viewer.html') });
    });

    document.getElementById('about-btn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://github.com/UnDadFeated/Freedom_PDF_Viewer' });
    });
});
