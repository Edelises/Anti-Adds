# 🚀 Anti-Adds Automation: How to Use

This system uses computer vision to detect and click close buttons on mirrored mobile ads.

## 🛠 Prerequisites
1. **Mirror iPhone to Mac**: Open QuickTime Player -> File -> New Movie Recording -> Click the arrow next to the record button and select your iPhone.
2. **Permissions**: Go to `System Settings > Privacy & Security`:
   - **Screen Recording**: Enable for your Terminal/IDE.
   - **Accessibility**: Enable for your Terminal/IDE (required for PyAutoGUI to click).
3. **Tesseract OCR**: If "Skip" detection via text is needed, install Tesseract:
   ```bash
   brew install tesseract
   ```

## 🌐 Web Dashboard (Next.js)
The system includes a premium real-time dashboard to monitor the automation.

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/).
2. **Setup Dashboard**:
   ```bash
   cd web
   npm install
   npm run dev
   ```
3. **Usage**: Open [http://localhost:3000](http://localhost:3000) in your browser.
4. **Integration**: The dashboard connects to the Python backend on port 8000. Ensure both are running.

## 📂 Project Structure
- `Python Files/`: Logic and Backend API.
- `web/`: Next.js Frontend.
- `templates/`: Place your button icons here.

## 🏃 Running the Full System (Recommended)
I have created a script that automatically kills old processes and starts everything fresh on ports 3000 and 8000.

1. **Run the startup script**:
   ```bash
   ./start_all.sh
   ```
2. **Dashboard**: Visit [http://localhost:3000](http://localhost:3000).

##  manual Running (Alternative)
If you prefer manual control:
1. **Start Backend**: `python3 "Python Files/main.py"` (Uses Port 8000)
2. **Start Frontend**: `cd web && npm run dev` (Uses Port 3000)

## 🧩 How to Get Templates
If the automatic extraction failed:
1. Take a screenshot of an ad with an "X" button.
2. Crop the "X" button tightly (e.g., 50x50 pixels).
3. Save it as `close_x.png` inside the `Python Files/templates` folder.
4. Repeat for "Skip" and "Play Now".
