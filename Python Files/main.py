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
import logging
from collections import deque

# Setup persistent debug logging
LOG_FILE = os.path.join(tempfile.gettempdir(), "antiadds_backend.log")
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    force=True
)
logging.info("--- BACKEND ENGINE BOOTING ---")
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import traceback
from PIL import Image
from detector import Detector
from clicker import Clicker

try:
    logging.info("Importing heavy dependencies...")
    import cv2
    import numpy as np
    import Quartz
    logging.info("Dependencies loaded successfully.")
except Exception as e:
    logging.error(f"FATAL: Dependency load failed: {str(e)}")
    logging.error(traceback.format_exc())
    sys.exit(1)

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


# ─── Helper: Capture via Quartz (Native macOS API) ─────────────────────────────
def capture_retina_quartz(window_id=None):
    """
    Directly captures the screen or a window using Quartz CGWindowListCreateImage.
    Bypasses screencapture CLI to avoid repeated permission prompts and overhead.
    """
    try:
        import Quartz
        from PIL import Image
        if window_id:
            image = Quartz.CGWindowListCreateImage(
                Quartz.CGRectNull,
                Quartz.kCGWindowListOptionIncludingWindow,
                window_id,
                Quartz.kCGWindowImageDefault
            )
        else:
            image = Quartz.CGWindowListCreateImage(
                Quartz.CGRectInfinite,
                Quartz.kCGWindowListOptionOnScreenOnly,
                Quartz.kCGNullWindowID,
                Quartz.kCGWindowImageDefault
            )
            
        if not image: return None

        width = Quartz.CGImageGetWidth(image)
        height = Quartz.CGImageGetHeight(image)
        bytes_per_row = Quartz.CGImageGetBytesPerRow(image)
        pixel_data = Quartz.CGDataProviderCopyData(Quartz.CGImageGetDataProvider(image))
        if not pixel_data: return None
        
        img = Image.frombytes("RGBA", (width, height), pixel_data, "raw", "BGRA", bytes_per_row, 1)
        return img.convert("RGB")
    except Exception as e:
        logging.error(f"Quartz capture error: {e}")
        return None

def get_iphone_window_id():
    """Use Quartz CGWindowList to find the iPhone Mirroring window."""
    try:
        windows = Quartz.CGWindowListCopyWindowInfo(
            Quartz.kCGWindowListOptionOnScreenOnly | Quartz.kCGWindowListExcludeDesktopElements,
            Quartz.kCGNullWindowID
        )
        for w in windows:
            owner = w.get("kCGWindowOwnerName", "")
            if "iPhone Mirroring" in owner:
                return int(w["kCGWindowNumber"])
    except Exception: pass
    return None

def has_accessibility_permission():
    """Check if we have permission to control the mouse/keyboard."""
    try:
        from ApplicationServices import AXIsProcessTrusted
        return AXIsProcessTrusted()
    except:
        return True # Fallback

def open_privacy_settings(panel="Privacy_ScreenCapture"):
    """Trigger macOS to open specific privacy panel."""
    subprocess.run(["open", f"x-apple.systempreferences:com.apple.preference.security?{panel}"])


# ─── FastAPI Setup ────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Helper: Check Screen Recording Permissions ──────────────────────────────
def has_screen_recording_permission():
    """Checks if the application has screen recording permissions.
    On macOS 10.15+, this is required for capturing other windows."""
    try:
        # CGPreflightScreenCaptureAccess returns True if we have permission
        return Quartz.CGPreflightScreenCaptureAccess()
    except AttributeError:
        # Fallback for older macOS or if Quartz is limited
        return True

# ─── Global State ────────────────────────────────────────────────────────────
state = {
    "is_running": True,  # Enable by default so it's ready on launch
    "mode": "macbook",   # default mode
    "has_permission": True, # Assume true, will check in loop
    "permission_warning_sent": False,
    "last_detection": "System Initialized",
    "last_screenshot": None,        # PIL Image — full screen
    "last_iphone_screenshot": None, # PIL Image — iPhone window only
    "iphone_window_id": None,       # CGWindowID for direct capture
    "mirror_roi": None,             # (x, y, w, h) logical points (kept for ad detection)
    "logs": deque(maxlen=50),       # Rolling log buffer — last 50 entries
    "config": {
        "threshold": 0.75,          # Template matching confidence (0.0-1.0)
        "jitter": 5,                # Click offset randomness in pixels
        "auto_click": True,         # Whether to actually click
        "scan_interval": 100        # Interval in ms between scans
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
    """Update engine configuration (threshold, jitter, etc) from the dashboard."""
    if "threshold" in data:
        val = max(0.1, min(1.0, float(data["threshold"])))
        state["config"]["threshold"] = val
        add_log(f"⚙️ Threshold set to {val:.0%}")
    if "jitter" in data:
        val = max(0, min(50, int(data["jitter"])))
        state["config"]["jitter"] = val
        add_log(f"⚙️ Jitter set to {val}px")
    if "auto_click" in data:
        state["config"]["auto_click"] = bool(data["auto_click"])
        add_log(f"⚙️ Auto-Click: {'ENABLED' if state['config']['auto_click'] else 'DISABLED'}")
    if "scan_interval" in data:
        val = max(10, int(data["scan_interval"]))
        state["config"]["scan_interval"] = val
        add_log(f"⚙️ Scan speed set to {val}ms")
    return {"status": "success", "config": state["config"]}


@app.post("/clear_logs")
def clear_logs():
    """Reset the rolling log buffer."""
    state["logs"].clear()
    add_log("🧹 Logs cleared by user")
    return {"status": "success"}


@app.get("/config")
def get_config():
    """Return current engine configuration."""
    return state["config"]


@app.post("/open_settings")
def open_settings(data: dict):
    """Open a specific macOS privacy panel."""
    panel = data.get("panel", "Privacy_ScreenCapture")
    open_privacy_settings(panel)
    return {"status": "success"}


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
        # 1. Check Permissions (macOS)
        p_screen = has_screen_recording_permission()
        p_access = has_accessibility_permission()
        
        state["has_permission"] = p_screen and p_access
        
        if not p_screen:
            if not state.get("permission_warning_sent"):
                add_log("🔐 Screen Recording permission required for detection.")
                state["permission_warning_sent"] = True
            time.sleep(2)
            continue
        
        if not p_access:
            if not state.get("access_warning_sent"):
                add_log("🖱️ Accessibility permission required to click ads.")
                state["access_warning_sent"] = True
            time.sleep(2)
            continue

        # If we got here, we have permissions
        if state.get("permission_warning_sent") or state.get("access_warning_sent"):
            add_log("✅ All permissions granted! Resuming...")
            state["permission_warning_sent"] = False
            state["access_warning_sent"] = False

        # 2. Idle when paused
        if not state["is_running"]:
            time.sleep(1)
            continue

        # Hot-reload config into detector each loop
        detector.threshold = state["config"]["threshold"]
        jitter = state["config"]["jitter"]
        auto_click = state["config"]["auto_click"]
        scan_interval = state["config"]["scan_interval"]

        # User objective: ONLY click (X), "Skip", "Close", or "View More" (to reveal X).
        # We increase specificity to avoid "clicking in random places".
        text_targets = ["skip ad", "skip", "close", "view more", "click to view", "sponsored x"]
        banned_patterns = ["play now", "install", "open", "okay", "cancel"]

        try:
            # ── 1. Always grab the full screen ──
            full_screenshot = capture_retina_quartz()
            if full_screenshot is None:
                add_log("⚠️ Screen capture failed")
                time.sleep(2)
                continue
            state["last_screenshot"] = full_screenshot

            # ── 2. ROI Selection ──
            if state["mode"] == "iphone":
                if state["iphone_window_id"] is None:
                    wid = get_iphone_window_id()
                    if wid:
                        state["iphone_window_id"] = wid
                        add_log(f"📱 iPhone Link Active (ID: {wid})")
                    else:
                        time.sleep(1)
                        continue

                # Refresh iPhone Window ROI
                try:
                    windows = Quartz.CGWindowListCopyWindowInfo(Quartz.kCGWindowListOptionOnScreenOnly, Quartz.kCGNullWindowID)
                    for w in windows:
                        if int(w.get("kCGWindowNumber", 0)) == state["iphone_window_id"]:
                            b = w["kCGWindowBounds"]
                            state["mirror_roi"] = (int(b["X"]), int(b["Y"]), int(b["Width"]), int(b["Height"]))
                            break
                except: pass

                active_roi = state["mirror_roi"]
                full_window_roi = state["mirror_roi"]
            else:
                active_roi = top_right_roi
                full_window_roi = (0, 0, screen_w, screen_h)

            # ── 3. High-Precision Detection ──
            found = None
            label = ""

            # Prioritize Template Matching (Icons) as they are most reliable for (X)
            if not found:
                found = detector.find_best_match(full_screenshot, "close_x", roi=full_window_roi)
                if found: label = "(X) Button"

            if not found:
                found = detector.find_best_match(full_screenshot, "skip", roi=full_window_roi)
                if found: label = "Skip Icon"

            # Fallback to OCR for text-based "Close" or "View More"
            if not found:
                found = detector.detect_text(full_screenshot, text_targets, roi=active_roi, banned_texts=banned_patterns)
                if found: label = "Text Bypass"

            # ── 4. Verified Action ──
            if found:
                if auto_click:
                    add_log(f"🎯 Targeted: {label} at {found}")
                    clicker.click_at(*found, jitter=jitter)
                    # Long sleep after click to allow UI to settle/animation to finish
                    time.sleep(2.5)
                else:
                    add_log(f"🔍 Monitoring: {label} visible")
                    time.sleep(1)
                continue

            state["last_detection"] = f"Scanning {state['mode']}..."

        except Exception as e:
            add_log(f"🚨 Error: {e}")
            time.sleep(1)

        time.sleep(scan_interval / 1000.0)




# ─── Entry Point ──────────────────────────────────────────────────────────────
def main():
    thread = threading.Thread(target=automation_loop, daemon=True)
    thread.start()
    print("🌐 Dashboard API running at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
