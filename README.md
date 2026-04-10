# Anti-Ads Detector (Premium Desktop Edition)

A high-performance standalone macOS native Desktop Engine designed natively to detect and silently automate advertisement skipping across interfaces using 4K computer vision and Machine Learning. 

This build bridges an encapsulated Python Backend with a sleek Tauri/Next.js interface.

### Important Note on Cloning
Because compiled system binaries are intentionally ignored from GitHub, downloading this repository to a completely new Mac means the Python Sidecar doesn't exist yet. You **must** configure your environment and rebuild the engine locally.

---

## 🛠️ Required Prerequisites (Mac Only)

Before you launch this on a new MacBook, open your terminal and install these base systems.

**1. Install Homebrew (If you don't have it)**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**2. Install Core System Dependencies**
```bash
brew install tesseract python npm rustup-init
rustup-init -y  # Completes Rust installation
```

**3. Install Python Dependencies**
The backend requires a few libraries installed globally to be properly packed natively by PyInstaller:
```bash
pip3 install pyautogui opencv-python pytesseract fastapi uvicorn pillow pyinstaller
```
*(If you run into MacOS blockages stating `externally-managed-environment`, append `--break-system-packages` to the pip command).*

---

## 🚀 Build Sequence (First Time Setup)

Whenever you download the repo from GitHub to a new Mac, follow this exact sequence:

1. **Make sure Python 3 is installed.**
2. **Rebuild the Python Backend Engine:** Navigate inside the root of the project and execute:
```bash
bash scratch/bundle_backend.sh
```
*What this does:* PyInstaller analyzes the application, wraps the CV code into a standalone Apple Darwin architecture executable, and injects it right into the Tauri container path: (`web/src-tauri/backend-engine-aarch64-apple-darwin`).

3. **Install Frontend Node Components:**
```bash
cd web
npm install
```

4. **Launch the APP:**
```bash
npm run tauri dev
```

---

## 📂 Architecture Note
**Do not touch `backend-engine*`:** When cloning, Git explicitly ignores `web/src-tauri/backend-engine*`. That binary is too massive strictly for Github. Because the compiled Python backend (the actual `backend-engine-aarch64-apple-darwin` executable) is explicitly ignored by `.gitignore` (which is standard practice for heavy binary files), downloading the repository means you are downloading the source code, not the compiled engine. Out of the box, it will NOT work unless you run the Build Sequence above!

**Tesseract OCR Restrictions:** `pytesseract` does not bundle the Tesseract engine directly, meaning `brew install tesseract` is an absolute requirement on any new Macbook; otherwise, the engine won't crash, but it will silently fail to click textual words like "watch" or "skip".
