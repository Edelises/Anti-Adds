import cv2
import numpy as np

# Load the cropped icon the user provided
img = cv2.imread("/Users/edelisesquaresma/.gemini/antigravity/brain/76a78249-fe0c-41d5-96fc-5652c43d2c28/media__1775829005579.png")
if img is not None:
    # Resize if it's too big, or just crop the center
    # The image is probably just the icon. Let's save it.
    cv2.imwrite("templates/skip_ff_icon.png", img)
    print("Saved skip_ff_icon.png from 5579, shape:", img.shape)
else:
    print("Failed to load 5579")

# Load the full screenshot to see if we can find it
img2 = cv2.imread("/Users/edelisesquaresma/.gemini/antigravity/brain/76a78249-fe0c-41d5-96fc-5652c43d2c28/media__1775828764201.png")
if img2 is not None:
    print("Loaded full screenshot, shape:", img2.shape)
