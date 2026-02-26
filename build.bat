@echo off
echo Building Lite PDF Annotator v1.6 for release...

:: Define output filename
set OUTPUT_ZIP=Lite_PDF_Annotator_v1.6.zip

:: Remove old zip if it exists
if exist "%OUTPUT_ZIP%" del "%OUTPUT_ZIP%"

:: Create zip archive excluding .git, .agents, and build scripts
powershell -NoProfile -Command "Compress-Archive -Path 'popup', 'pdfjs', 'background.js', 'manifest.json', 'README.md', 'store_icon_128x128_solid.png', 'store_promo_1280x800.png' -DestinationPath '%OUTPUT_ZIP%' -Force"

echo.
echo Build complete! Successfully created %OUTPUT_ZIP%
echo You can now upload this archive to the Chrome Web Store.
pause
