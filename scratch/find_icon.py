import cv2
import numpy as np

img = cv2.imread("/Users/edelisesquaresma/.gemini/antigravity/brain/76a78249-fe0c-41d5-96fc-5652c43d2c28/media__1775828764201.png")
# Top left corner is usually the first 10-150 pixels in both x and y.
# Let's crop x:[0,150], y:[0,150]
top_left = img[0:150, 0:150]
cv2.imwrite("scratch/top_left.png", top_left)
# Let's see if we can do some basic thresholding to isolate white triangles
gray = cv2.cvtColor(top_left, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
cv2.imwrite("scratch/top_left_thresh.png", thresh)

# find bounding box of white pixels in thresh
coords = cv2.findNonZero(thresh)
if coords is not None:
    x, y, w, h = cv2.boundingRect(coords)
    print(f"Found white shape at x={x}, y={y}, w={w}, h={h}")
    # crop exactly that box with a tiny margin
    margin = 5
    x_min = max(0, x - margin)
    y_min = max(0, y - margin)
    x_max = min(150, x + w + margin)
    y_max = min(150, y + h + margin)
    
    icon = top_left[y_min:y_max, x_min:x_max]
    cv2.imwrite("templates/skip_ff.png", icon)
    print("Saved templates/skip_ff.png")
else:
    print("No white shape found in top left corner")
