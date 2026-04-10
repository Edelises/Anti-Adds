import cv2
import os

def extract_templates():
    input_images = [
        '../input_file_0.png',
        '../input_file_1.png',
        '../input_file_2.png',
        '../input_file_3.png',
        '../input_file_4.png'
    ]
    
    output_dir = 'templates'
    os.makedirs(output_dir, exist_ok=True)

    # 1. Extract X from input_file_1.png (Top Right)
    img1 = cv2.imread(input_images[1])
    if img1 is not None:
        h, w = img1.shape[:2]
        # Estimate X position in top right
        x_btn = img1[30:100, w-100:w-30] 
        cv2.imwrite(os.path.join(output_dir, 'close_x.png'), x_btn)
        print("Saved close_x.png")

    # 2. Extract Play Now from input_file_2.png (Top Left)
    img2 = cv2.imread(input_images[2])
    if img2 is not None:
        # Estimate Play Now position
        play_btn = img2[110:175, 110:440]
        cv2.imwrite(os.path.join(output_dir, 'play_now.png'), play_btn)
        print("Saved play_now.png")

    # 3. Extract Skip from input_file_0.png (Top Right)
    img0 = cv2.imread(input_images[0])
    if img0 is not None:
        h, w = img0.shape[:2]
        skip_btn = img0[60:105, w-80:w-30]
        cv2.imwrite(os.path.join(output_dir, 'skip.png'), skip_btn)
        print("Saved skip.png")

if __name__ == "__main__":
    extract_templates()
