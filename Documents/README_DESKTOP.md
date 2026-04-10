# Anti-Adds Detector: Windows Desktop Version

This project uses **Tauri** to provide a high-performance, native desktop experience.

## Prerequisites for Windows
To build the `.exe` for Windows, you need to run these steps on a **Windows machine**:

1. **Install Rust**: [https://rustup.rs/](https://rustup.rs/)
2. **Install WebView2**: (Usually included with Windows 10/11)
3. **Install Node.js**: [https://nodejs.org/](https://nodejs.org/)
4. **Build Tools for Visual Studio 2022**: Ensure "C++ build tools" and the Windows SDK are selected.

## How to Build (Windows EXE)
1. Open PowerShell or Command Prompt in the project root.
2. Navigate to the web folder:
   ```cmd
   cd web
   ```
3. Install dependencies:
   ```cmd
   npm install
   ```
4. Build the executable:
   ```cmd
   npm run tauri build
   ```
5. Your installer will be located at:
   `web/src-tauri/target/release/bundle/msi/`

## Running on macOS (Current Environment)
To run or build on your current Mac:
1. Run `./start_desktop.sh` to launch the development version.
2. Run `cd web && npx tauri build` to generate a `.dmg` or `.app`.

## Performance Note
Tauri is significantly faster and uses less memory than Electron because it leverages the native OS webview (WebKit on Mac, WebView2 on Windows) and a Rust-powered backend.
