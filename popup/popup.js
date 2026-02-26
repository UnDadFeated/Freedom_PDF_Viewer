document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('open-viewer').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('pdfjs/web/viewer.html') });
    });
});
