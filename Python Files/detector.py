import cv2
import numpy as np
import pyautogui
from PIL import Image
import pytesseract

class Detector:
    def __init__(self, templates_dir='templates', threshold=0.8):
        self.templates_dir = templates_dir
        self.threshold = threshold
        self.templates = {} # Cached templates
        
    def load_templates(self):
        """Load all templates found in the templates directory."""
        import os
        if not os.path.exists(self.templates_dir):
            return
        for file in os.listdir(self.templates_dir):
            if file.endswith('.png'):
                path = os.path.join(self.templates_dir, file)
                self.templates[file] = cv2.imread(path, 0)
                print(f"Loaded template: {file}")

    def find_best_match(self, screenshot, category_prefix, scales=[0.8, 0.9, 1.0, 1.1, 1.2], roi=None):
        """
        Find the best match among all templates starting with category_prefix.
        Returns (x, y) of the best match or None.
        """
        relevant_templates = [t for t in self.templates.keys() if t.startswith(category_prefix)]
        if not relevant_templates:
            return None
            
        return self._find_best_in_category(screenshot, relevant_templates, scales, roi)

    def _find_best_in_category(self, screenshot, template_names, scales, roi):
        best_match = None
        max_val = -1
        
        frame = np.array(screenshot)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Retina Detection: If screenshot is much larger than templates, templates need upscaling or screenshot needs downscaling
        # Example: Mac screenshot is often 2x the logical size.
        # We will add a 2.0 scale to the scales list to handle this automatically if found.
        if gray.shape[0] > 1200: # Typical Retina height threshold
            scales = [s * 2.0 for s in scales] + scales

        # Crop to ROI if provided
        search_gray = gray
        offset_x, offset_y = 0, 0
        if roi:
            rx, ry, rw, rh = roi
            # Adjust ROI for Retina if detected
            if gray.shape[0] > 1200:
                rx, ry, rw, rh = rx*2, ry*2, rw*2, rh*2
                
            rx, ry = max(0, rx), max(0, ry)
            rw = min(rw, gray.shape[1] - rx)
            rh = min(rh, gray.shape[0] - ry)
            search_gray = gray[ry:ry+rh, rx:rx+rw]
            offset_x, offset_y = rx, ry

        for name in template_names:
            template = self.templates[name]
            t_h, t_w = template.shape
            
            for scale in scales:
                new_w, new_h = int(t_w * scale), int(t_h * scale)
                if new_w < 5 or new_h < 5: continue
                
                resized_t = cv2.resize(template, (new_w, new_h))
                if resized_t.shape[0] > search_gray.shape[0] or resized_t.shape[1] > search_gray.shape[1]:
                    continue
                    
                res = cv2.matchTemplate(search_gray, resized_t, cv2.TM_CCOEFF_NORMED)
                _, val, _, loc = cv2.minMaxLoc(res)
                
                if val > max_val and val >= self.threshold:
                    max_val = val
                    center_x = loc[0] + (resized_t.shape[1] // 2)
                    center_y = loc[1] + (resized_t.shape[0] // 2)
                    # Convert Retina pixels back to logical pixels for PyAutoGUI
                    final_x = (center_x + offset_x)
                    final_y = (center_y + offset_y)
                    if gray.shape[0] > 1200:
                         final_x //= 2
                         final_y //= 2
                    best_match = (final_x, final_y)
        
        return best_match

    def detect_text(self, screenshot, target_texts, roi=None, banned_texts=None):
        """Use OCR to find specific text items. target_texts can be a list."""
        if banned_texts is None:
            banned_texts = ["play now", "okay"]

        try:
            frame = np.array(screenshot)
            offset_x, offset_y = 0, 0
            
            # Retina scaling for ROI
            is_retina = frame.shape[0] > 1200

            if roi:
                rx, ry, rw, rh = roi
                if is_retina:
                    rx, ry, rw, rh = rx*2, ry*2, rw*2, rh*2
                
                rx, ry = max(0, rx), max(0, ry)
                rw = min(rw, frame.shape[1] - rx)
                rh = min(rh, frame.shape[0] - ry)
                frame = frame[ry:ry+rh, rx:rx+rw]
                offset_x, offset_y = rx, ry
                
            # Preprocessing for OCR: Grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Simple OCR run
            d = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
            
            # Group by line_num (and block/par) to check multi-word contexts
            lines = {}
            for i in range(len(d['text'])):
                text = d['text'][i].strip().lower()
                if not text:
                    continue
                
                # Create a unique key for the line
                line_key = (d['block_num'][i], d['par_num'][i], d['line_num'][i])
                if line_key not in lines:
                    lines[line_key] = {"text": [], "boxes": []}
                
                lines[line_key]["text"].append(text)
                lines[line_key]["boxes"].append((d['left'][i], d['top'][i], d['width'][i], d['height'][i]))
                
            # Now evaluate each line
            for line_key, line_data in lines.items():
                full_line_text = " ".join(line_data["text"])
                
                # Check for banned texts anywhere in this line
                is_banned = False
                for b_text in banned_texts:
                    if b_text.lower() in full_line_text:
                        is_banned = True
                        break
                
                if is_banned:
                    continue
                    
                # Check targets
                for target in target_texts:
                    # Look for target in the full line
                    if target.lower() in full_line_text:
                        # We found a matching line! Compute center of the FIRST matching word box
                        # or just the center of the whole bounding box of the line.
                        # Let's take the bounding box of the entire line for safety.
                        x_min = min(b[0] for b in line_data["boxes"])
                        y_min = min(b[1] for b in line_data["boxes"])
                        x_max = max(b[0] + b[2] for b in line_data["boxes"])
                        y_max = max(b[1] + b[3] for b in line_data["boxes"])
                        
                        fx = (x_min + (x_max - x_min) // 2) + offset_x
                        fy = (y_min + (y_max - y_min) // 2) + offset_y
                        
                        if is_retina:
                            fx //= 2
                            fy //= 2
                            
                        return (fx, fy)
                        
        except Exception as e:
            # Tesseract not found or crashed
            pass
        return None
