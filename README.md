# Freedom PDF Viewer Extension (v2.5)

![Version](https://img.shields.io/badge/version-2.5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)

A lightning-fast, ultra-lightweight PDF reader and annotator built as a Chrome Extension. Designed for privacy, speed, and memory efficiency, it allows you to intercept local PDFs, draw freehand, and insert custom text without ever sending your data to a server.

## ✨ Features

* **🔒 100% Offline & Private:** Built natively with the official Mozilla `pdf.js` distribution. Your documents never leave your browser.
* **🔀 Local File Interception:** Drag and drop any `.pdf` directly into Chrome, and it will automatically be routed to the native workspace without CORS errors.
* **🖊️ Rich Annotation Tools:** Use built-in PDF.js tools for freehand ink drawing, erasing, adding signatures, and injecting text natively.
* **🌙 Robust UI:** Leverages the powerful PDF.js viewer interface for universally consistent document viewing, including thumbnails, search, and outlines.
* **💾 Save and Export:** All annotations—ink, signatures, and texts—are saved directly into the PDF via standard download.

## 🛠️ Installation (Developer Mode)

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked** and select the directory containing this extension.
5. **Crucial:** Click "Details" on the installed extension and toggle on **Allow access to file URLs** (This enables drag-and-drop support).

## 🚀 Usage

* **Open a file:** Click the extension icon or navigate to a PDF, or simply drag and drop a local PDF file directly into a new browser tab.
* **Annotate:** Click the drawing or text annotation tools in the top right toolbar to draw ink, add text, or place signatures directly on the document.
* **Save your work:** Click the download or print buttons to save your marked-up file natively.

## 📦 Building for Release

To package the extension for upload to the Chrome Web Store, simply run the included `build.bat` script on Windows. It will securely compress the necessary files into `Freedom_PDF_Viewer_v2.5.zip`, deliberately excluding development files like `.git`.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
2. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the Branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
