chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    // Check if it's the main frame and not an internal extension page
    if (details.frameId === 0 && !details.url.startsWith('chrome-extension://')) {
        const viewerUrl = chrome.runtime.getURL('pdfjs/web/viewer.html') + '?file=' + encodeURIComponent(details.url);
        // Redirect the tab to our extension's viewer
        chrome.tabs.update(details.tabId, { url: viewerUrl });
    }
}, {
    // Only intercept URLs that end with .pdf
    url: [{ urlSuffix: '.pdf' }]
});
