chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    try {
        // Check if it's the main frame and not an internal extension page
        if (details.frameId === 0 && !details.url.startsWith('chrome-extension://')) {
            // Validate the URL protocol to prevent malicious injections
            const urlObj = new URL(details.url);
            if (['http:', 'https:', 'file:'].includes(urlObj.protocol)) {
                const viewerUrl = chrome.runtime.getURL('pdfjs/web/viewer.html') + '?file=' + encodeURIComponent(details.url);
                // Redirect the tab to our extension's viewer
                chrome.tabs.update(details.tabId, { url: viewerUrl });
            } else {
                console.warn('Blocked interception of unsupported protocol:', urlObj.protocol);
            }
        }
    } catch (e) {
        console.error('Error during PDF interception navigation:', e);
    }
}, {
    // Only intercept URLs that end with .pdf
    url: [{ urlSuffix: '.pdf' }]
});
