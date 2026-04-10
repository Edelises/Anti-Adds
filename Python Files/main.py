"""
Anti-Adds Backend Engine
========================
Captures the iPhone Mirroring window DIRECTLY using macOS CGWindowID,
giving pixel-perfect Retina screenshots with zero cropping.
Uses Quartz for window discovery and screencapture -l for direct window capture.
"""

import time
import pyautogui
import threading
import subprocess
import tempfile
import os
import io
from collections import deque
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
from PIL import Image
from detector import Detector
from clicker import Clicker

# ─── Path Resolution: Finds files whether running in Dev or Bundled ──────────
def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller."""
    if getattr(sys, 'frozen', False):
        # We are running as a binary (sidecar)
        base_path = os.path.dirname(sys.executable)
        # Check if we are inside a macOS app bundle
        if ".app/Contents/MacOS" in base_path:
            # Go up to Contents, then down to Resources
            res_path = os.path.normpath(os.path.join(os.path.dirname(base_path), "Resources", relative_path))
            if os.path.exists(res_path):
                return res_path
        return os.path.join(base_path, relative_path)
    
    # Dev mode: look relative to project root
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(root, relative_path)

# Quartz is a macOS-native framework — no pip install needed
import Quartz


# ─── Temp file paths for captures ────────────────────────────────────────────
_FULL_CAP   = os.path.join(tempfile.gettempdir(), "antiadds_full.png")
_IPHONE_CAP = os.path.join(tempfile.gettempdir(), "antiadds_iphone.png")


# ─── Helper: Find the iPhone Mirroring CGWindowID ─────────────────────────────
def get_iphone_window_id():
    """Use Quartz CGWindowList to find the iPhone Mirroring window.
    Returns the CGWindowID (int) or None if the window isn't open."""
    try:
        windows = Quartz.CGWindowListCopyWindowInfo(
            Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements,
            Quartz.kCGNullWindowID
        )
        for w in windows:
            owner = w.get("kCGWindowOwnerName", "")
            # Match the iPhone Mirroring app by owner name
            if "iPhone Mirroring" in owner:
                return int(w["kCGWindowNumber"])
    except Exception:
        pass
    return None


# ─── Helper: Capture a specific window by its CGWindowID ──────────────────────
def capture_window(window_id, output_path):
    """Use macOS screencapture to grab a single window at full Retina quality.
    -x = silent, -l = specific window ID, -o = no shadow."""
    try:
        subprocess.run(
            ["screencapture", "-x", "-o", "-l", str(window_id), output_path],
            timeout=3, check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        img = Image.open(output_path)
        img.load()  # Force full read into memory
        return img
    except Exception:
        return None


# ─── Helper: Capture the full screen ─────────────────────────────────────────
def capture_full_screen():
    """Full-screen Retina capture using macOS screencapture."""
    try:
        subprocess.run(
            ["screencapture", "-x", "-C", "-t", "png", _FULL_CAP],
            timeout=3, check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        img = Image.open(_FULL_CAP)
        img.load()
        return img
    except Exception:
        return None


# ─── FastAPI Setup ────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global shared state
state = {
    "is_running": False,
    "mode": "macbook",              # "macbook" or "iphone"
    "last_detection": "System Initialized",
    "last_screenshot": None,        # PIL Image — full screen
    "last_iphone_screenshot": None, # PIL Image — iPhone window only
    "iphone_window_id": None,       # CGWindowID for direct capture
    "mirror_roi": None,             # (x, y, w, h) logical points (kept for ad detection)
    "logs": deque(maxlen=50),       # Rolling log buffer — last 50 entries
    "config": {
        "threshold": 0.75,          # Template matching confidence (0.0-1.0)
        "jitter": 5,                # Click offset randomness in pixels
    },
}


# ─── Helper: Add to rolling log ──────────────────────────────────────────────
def add_log(msg):
    """Append a timestamped message to the rolling log buffer."""
    from datetime import datetime
    ts = datetime.now().strftime("%H:%M:%S")
    state["logs"].append(f"[{ts}] {msg}")
    state["last_detection"] = msg


# ─── API Endpoints ───────────────────────────────────────────────────────────
@app.get("/status")
def get_status():
    """Return engine state (excluding large PIL images)."""
    return {
        k: (list(v) if isinstance(v, deque) else v)
        for k, v in state.items()
        if k not in ("last_screenshot", "last_iphone_screenshot")
    }


@app.get("/screenshot")
def get_screenshot():
    """Full-screen screenshot at Retina quality."""
    img = state["last_screenshot"]
    if img is None:
        return Response(content=b"", status_code=404)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.get("/screenshot_iphone")
def get_screenshot_iphone():
    """Direct capture of the iPhone Mirroring window — no cropping, full quality."""
    # Prefer the dedicated iPhone capture
    img = state["last_iphone_screenshot"]
    if img is not None:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")

    # Fallback: serve the full screen if iPhone not captured yet
    img = state["last_screenshot"]
    if img is not None:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")

    raise HTTPException(404, "No screenshot available")


@app.post("/toggle")
def toggle_automation():
    """Start or stop the automation engine."""
    state["is_running"] = not state["is_running"]
    action = "started" if state["is_running"] else "stopped"
    add_log(f"🔄 Engine {action}")
    return {"status": "success", "is_running": state["is_running"]}


@app.post("/set_mode")
def set_mode(data: dict):
    """Switch between macbook and iphone monitoring modes."""
    state["mode"] = data.get("mode", "macbook")
    state["iphone_window_id"] = None  # Reset so it re-discovers
    state["mirror_roi"] = None
    state["last_iphone_screenshot"] = None
    add_log(f"🔀 Mode switched to {state['mode']}")
    return {"status": "success", "mode": state["mode"]}


@app.post("/config")
def update_config(data: dict):
    """Update engine configuration (threshold, jitter) from the dashboard."""
    if "threshold" in data:
        # Clamp to valid range 0.1 - 1.0
        val = max(0.1, min(1.0, float(data["threshold"])))
        state["config"]["threshold"] = val
        add_log(f"⚙️ Threshold set to {val:.0%}")
    if "jitter" in data:
        # Clamp to 0-50 px
        val = max(0, min(50, int(data["jitter"])))
        state["config"]["jitter"] = val
        add_log(f"⚙️ Jitter set to {val}px")
    return {"status": "success", "config": state["config"]}


@app.get("/config")
def get_config():
    """Return current engine configuration."""
    return state["config"]


# ─── Automation Loop (background thread) ─────────────────────────────────────
def automation_loop():
    add_log("🚀 Engine thread started")
    
    # Use the shared resource path for templates
    temp_dir = get_resource_path("templates")
    detector = Detector(templates_dir=temp_dir, threshold=state["config"]["threshold"])
    
    clicker = Clicker()
    detector.load_templates()
    add_log(f"📦 {len(detector.templates)} templates loaded")

    # MacBook mode: scan the right half of the screen for ads
    screen_w, screen_h = pyautogui.size()
    top_right_roi = (screen_w // 2, 0, screen_w // 2, screen_h // 2)

    # Ordered list of text to click. "watch" / "more ads" is highest priority.
    # We DO NOT include "play" or "okay" so we completely avoid "Play now" options.
    text_targets = ["watch", "more ads", "skip", "close", "sponsored", "ad"]

    while True:
        # Idle when paused
        if not state["is_running"]:
            time.sleep(1)
            continue

        # Hot-reload config into detector each loop
        detector.threshold = state["config"]["threshold"]
        jitter = state["config"]["jitter"]

        try:
            # ── 1. Always grab the full screen (for MacBook panel + detection) ──
            full_screenshot = capture_full_screen()
            if full_screenshot is None or full_screenshot.width < 100:
                add_log("⚠️ Screen capture failed")
                time.sleep(2)
                continue
            state["last_screenshot"] = full_screenshot

            # ── 2. iPhone mode: capture the Mirroring window directly ───────────
            if state["mode"] == "iphone":
                # Find the window ID if we don't have it yet
                if state["iphone_window_id"] is None:
                    wid = get_iphone_window_id()
                    if wid:
                        state["iphone_window_id"] = wid
                        add_log(f"📱 iPhone window found (ID: {wid})")
                    else:
                        add_log("❌ iPhone Mirroring not open")
                        state["last_iphone_screenshot"] = None
                        time.sleep(1)
                        continue

                # Capture the window directly — full Retina, no crop
                iphone_img = capture_window(state["iphone_window_id"], _IPHONE_CAP)
                if iphone_img:
                    state["last_iphone_screenshot"] = iphone_img
                else:
                    # Window may have closed — reset and retry
                    state["iphone_window_id"] = None
                    add_log("⚠️ iPhone capture failed, re-scanning...")
                    time.sleep(1)
                    continue

                # For ad detection, get the iPhone window's logical bounds as ROI
                try:
                    windows = Quartz.CGWindowListCopyWindowInfo(
                        Quartz.kCGWindowListOptionOnScreenOnly,
                        Quartz.kCGNullWindowID
                    )
                    for w in windows:
                        if int(w.get("kCGWindowNumber", 0)) == state["iphone_window_id"]:
                            b = w["kCGWindowBounds"]
                            state["mirror_roi"] = (
                                int(b["X"]), int(b["Y"]),
                                int(b["Width"]), int(b["Height"])
                            )
                            break
                except Exception:
                    pass

                active_roi = state["mirror_roi"]
                full_window_roi = state["mirror_roi"]
            else:
                active_roi = top_right_roi
                full_window_roi = (0, 0, screen_w, screen_h)

            # ── 3. Detect ad UI elements in the active region ───────────────────
            found = None
            label = ""

            found = detector.detect_text(full_screenshot, text_targets, roi=active_roi)
            if found:
                label = "Text target"

            if not found:
                # Top left play symbols exist! Search full window for skip masks.
                found = detector.find_best_match(full_screenshot, "skip", roi=full_window_roi)
                if found:
                    label = "Skip icon"

            if not found:
                found = detector.find_best_match(full_screenshot, "close_x", roi=full_window_roi)
                if found:
                    label = "Close icon"

            # ── 4. Click if found ───────────────────────────────────────────────
            if found:
                add_log(f"✅ Clicking {label} at ({found[0]}, {found[1]})")
                clicker.click_at(*found, jitter=jitter)
                time.sleep(3)
                continue

            state["last_detection"] = f"Scanning {state['mode']}..."

        except Exception as e:
            add_log(f"🚨 Error: {e}")
            time.sleep(1)

        time.sleep(0.5)


# ─── Entry Point ──────────────────────────────────────────────────────────────
def main():
    thread = threading.Thread(target=automation_loop, daemon=True)
    thread.start()
    print("🌐 Dashboard API running at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
