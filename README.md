# Freedom PDF Viewer Extension (v3.0.1)

![Version](https://img.shields.io/badge/version-3.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)

A lightning-fast, ultra-lightweight PDF reader and annotator built as a Chrome Extension. Designed for privacy, speed, and memory efficiency, it allows you to intercept local PDFs, draw freehand, and insert custom text without ever sending your data to a server.

## ✨ Features

- **🔒 100% Offline & Private:** Built natively with the official Mozilla `pdf.js` distribution. Your documents never leave your browser.
- **🛡️ Secure Processing:** Includes a strict Content Security Policy (CSP) to isolate processes and intercept validation logic to mitigate malicious injections.
- **🔀 Local File Interception:** Drag and drop any `.pdf` directly into Chrome, and it will automatically be routed to the native workspace without CORS errors.
- **🖊️ Rich Annotation Tools:** Use built-in PDF.js tools for freehand ink drawing, erasing, adding signatures, and injecting text natively.
- **⚡ Blazing Fast:** Designed to be memory-efficient and open PDFs instantly.
- **💾 Easy Saving:** Save your annotated PDFs back to your computer with a single click.

## 🚀 Getting Started

1. Download the [Freedom_PDF_Viewer_v3.0.1.zip](link-to-releases) from the Releases page.
2. Unzip the file into a folder on your computer.
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top right corner.
5. Click **Load unpacked** and select the folder where you unzipped the extension.
6. The extension is now installed! You can now drag and drop PDFs into the browser to view them.

## 📦 Building for Release

To package the extension for upload to the Chrome Web Store, simply run the included `build.bat` script on Windows. It will securely compress the necessary files into `Freedom_PDF_Viewer_v3.0.1.zip`, deliberately excluding development files like `.git`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](link-to-issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

This project utilizes [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla, which is licensed under the Apache License 2.0.
