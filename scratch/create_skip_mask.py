import cv2
import numpy as np

# We'll draw the skip symbol as a white template on black background.
# A skip symbol is typically:
# a triangle pointing right + a vertical rectangle.
template = np.zeros((40, 40), dtype=np.uint8)

# The size doesn't need to be perfect, we'll try different scales in code later
# Draw triangle
triangle_cnt = np.array([ [10, 10], [10, 30], [25, 20] ])
cv2.drawContours(template, [triangle_cnt], 0, 255, -1)

# Draw vertical bar
cv2.rectangle(template, (27, 10), (31, 30), 255, -1)

# Add a bit of blur so it matches anti-aliased icons better
template = cv2.GaussianBlur(template, (3,3), 0)

cv2.imwrite("templates/skip_symbol_mask.png", template)
print("Created templates/skip_symbol_mask.png")
