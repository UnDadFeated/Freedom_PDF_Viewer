@echo off
echo Building Freedom PDF Viewer v2.7 for release...

:: Define output filename
set OUTPUT_ZIP=Freedom_PDF_Viewer_v2.7.zip

:: Remove old zip if it exists
if exist "%OUTPUT_ZIP%" del "%OUTPUT_ZIP%"

:: Create zip archive excluding .git, .agents, and build scripts
powershell -NoProfile -Command "Compress-Archive -Path 'popup', 'pdfjs', 'background.js', 'manifest.json', 'README.md' -DestinationPath '%OUTPUT_ZIP%' -Force"

echo.
echo Build complete! Successfully created %OUTPUT_ZIP%
echo You can now upload this archive to the Chrome Web Store.
pause
