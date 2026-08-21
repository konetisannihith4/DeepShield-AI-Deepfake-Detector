import os
import cv2
import numpy as np

def generate_ai_variations():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    # 1. AI Portrait 1 Crop / High-frequency
    ref1 = os.path.join(uploads_dir, "ai_boy_portrait1.png")
    if os.path.exists(ref1):
        img1 = cv2.imread(ref1)
        H, W = img1.shape[:2]

        # Crop Center Face Region
        face_crop = img1[H//6 : 5*H//6, W//6 : 5*W//6]
        dest_crop = os.path.join(uploads_dir, "ai_boy_portrait1_crop.png")
        cv2.imwrite(dest_crop, face_crop)
        print("  [CREATED] ai_boy_portrait1_crop.png")

        # JPEG Compressed AI Specimen (QF=50)
        dest_q50 = os.path.join(uploads_dir, "ai_boy_portrait1_jpeg_q50.jpg")
        cv2.imwrite(dest_q50, img1, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
        print("  [CREATED] ai_boy_portrait1_jpeg_q50.jpg")

    # 2. AI ChatGPT Crop / Resample
    ref2 = os.path.join(uploads_dir, "ai_chatgpt.png")
    if os.path.exists(ref2):
        img2 = cv2.imread(ref2)
        H, W = img2.shape[:2]

        # Downscaled & Upscaled AI Specimen
        small = cv2.resize(img2, (W//2, H//2), interpolation=cv2.INTER_AREA)
        upscaled = cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR)
        dest_res = os.path.join(uploads_dir, "ai_chatgpt_resampled_0.5x.png")
        cv2.imwrite(dest_res, upscaled)
        print("  [CREATED] ai_chatgpt_resampled_0.5x.png")

        # Brightness / Color Jitter AI Specimen
        hsv = cv2.cvtColor(img2, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.1 + 15, 0, 255)
        jittered = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        dest_jit = os.path.join(uploads_dir, "ai_chatgpt_color_jitter.png")
        cv2.imwrite(dest_jit, jittered)
        print("  [CREATED] ai_chatgpt_color_jitter.png")

    print("AI variations generation complete.")

if __name__ == "__main__":
    generate_ai_variations()
