# 🦾 Anti-Ads Precision Engine (Premium Edition)

A professional-grade, high-performance macOS monitoring suite and automation engine. Built with a native **Quartz-driven** capture pipeline and an AI-powered detection core, this engine identifies and surgically bypasses advertisement elements in real-time across both your MacBook and mirrored iPhone interfaces.

---

## 💎 Key Features & Dashboard Logic

### 1. High-Precision "Sniper" Engine
The core automation logic operates on a "Precision First" philosophy. Unlike generic auto-clickers, this engine is trained to identify specific ad-bypass geometries:
- **(X) Template Matching**: Pixel-perfect detection of close icons across varying resolutions.
- **OCR Bypass**: Real-time text analysis for skip-triggers like "Skip Ad" or "View More".
- **Hard Blacklist**: Explicitly ignores marketing decoys like "Play Now", "Install", or "Ok" to prevent accidental application switching.

### 2. Tri-Column Telemetry Dashboard
The interface is optimized for full-height monitoring on MacBook displays:
- **Left Sidebar (Config)**: Real-time sensitive control over **AI Threshold (Confidence)**, **Auto-Bypass (Zap)**, and **Cycle Velocity (Engine Speed)**.
- **Center Workspace (Visual)**: A high-fidelity, distortion-free monitoring feed that swaps between MacBook and iPhone modes.
- **Right Sidebar (Telemetry)**: Real-time system diagnostics including **CPU Compute Load**, **Network Latency**, and the **Live Bypass Counter**.

### 3. Integrated Terminal Control
A dedicated telemetry log that tracks every engine action.
- **Auto-Scrolling**: Keeps you locked to the newest system events.
- **Log Eraser**: Instantly clear session history for a fresh monitoring start without stopping the engine.

---

## 🛠️ Requirements & System Setup

### macOS Permissions (CRITICAL)
For the engine to capture screenshots and interact with your screen, you must manually authorize the app in:
1. **System Settings > Privacy & Security > Screen Recording**
2. **System Settings > Privacy & Security > Accessibility**
3. **System Settings > Privacy & Security > Automation**

### Prerequisites
```bash
# Core dependencies via Homebrew
brew install tesseract python npm

# Python libraries required for the detection core
pip3 install pyautogui opencv-python pytesseract fastapi uvicorn pillow pyinstaller --break-system-packages
```

---

## 🚀 Reactivation Guide (If you exported/cloned the repo)

**IMPORTANT**: Due to repository size limits, the compiled **Python Sidecar Binary** is NOT included in the GitHub export. You MUST rebuild the engine logic before the app will function.

### 1. Rebuild the Detection Core
Navigate to the project root and execute the bundling script:
```bash
./build_standalone.sh
```
*This identifies your architecture (Intel or Apple Silicon), compiles the Python backend into a standalone native binary, and moves it to `web/src-tauri/`.*

### 2. Initialize Frontend
```bash
cd web
npm install
```

### 3. Launch Development Mode
```bash
npm run dev
```

---

## 📂 Project Architecture

- **`/Python Files`**: The Detection Core (FastAPI Backend).
- **`/web`**: The Desktop Shell (Tauri) and UI (Next.js).
- **`/templates`**: High-confidence image samples for pixel-perfect icon matching.
- **`/SQL Scripts`**: Database initialization (if applicable).
- **`/Documents`**: Detailed tutorials and research notes.

---

## 🛡️ Efficiency & Safety
The engine is designed to be **Lean**. Using native macOS Quartz APIs, it captures the screen with 15x less overhead than standard screenshot tools, ensuring your MacBook stays cool and your latency stays low (<40ms).
