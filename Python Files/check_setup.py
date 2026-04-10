import os
import cv2
import pyautogui

def check():
    print("📋 Anti-Adds Setup Check")
    
    # Check dependencies
    try:
        import cv2
        import pyautogui
        import numpy
        import pytesseract
        print("✅ Dependencies: Found")
    except ImportError as e:
        print(f"❌ Dependencies: Missing ({e})")

    # Check templates
    templates = ['close_x.png', 'skip.png', 'play_now.png']
    missing_templates = []
    for t in templates:
        path = os.path.join('templates', t)
        if not os.path.exists(path):
            missing_templates.append(t)
            
    if not missing_templates:
        print("✅ Templates: All present")
    else:
        print(f"⚠️ Templates: Missing {missing_templates}")
        print("   Please save your button screenshots into the 'Python Files/templates' folder.")

    # Check Screen Permissions (MacOS specific)
    print("🔔 Note: On macOS, ensure 'Terminal' or your IDE has 'Screen Recording' and 'Accessibility' permissions in System Settings.")

if __name__ == "__main__":
    check()
