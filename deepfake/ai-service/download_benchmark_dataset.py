import os
import urllib.request
import cv2
import numpy as np

def download_file(url: str, dest_path: str) -> bool:
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=15) as response, open(dest_path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"  [OK] Downloaded: {os.path.basename(dest_path)}")
        return True
    except Exception as e:
        print(f"  [ERR] Failed downloading {os.path.basename(dest_path)}: {e}")
        return False

def create_benchmark_dataset():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    print("=" * 80)
    print("EXPANDING BENCHMARK DATASET IN uploads/")
    print("=" * 80)

    # 1. AI-Generated Image URLs (Diverse Generators)
    ai_images = [
        ("ai_sdxl_landscape.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/sdxl-text2img.png"),
        ("ai_sdxl_img2img.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/sdxl-img2img.png"),
        ("ai_sd3_portrait.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/sd3-text2img.png"),
        ("ai_flux_artwork.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/flux-text2img.png"),
        ("ai_kandinsky_fantasy.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/kandinsky-text2img.png"),
        ("ai_unclip_specimen.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/unclip-text2img.png"),
        ("ai_wuerstchen_art.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/wuerstchen-text2img.png"),
        ("ai_pixart_landscape.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/pixart-text2img.png"),
        ("ai_shap_e_3d.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/shap_e_out.png"),
        ("ai_gan_bedroom.jpg", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/img2img-init.png")
    ]

    # 2. Genuine Camera Photograph URLs
    real_images = [
        ("real_camera_tiger.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/tiger.jpg"),
        ("real_camera_teapot.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/teapot.jpg"),
        ("real_camera_palace.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/palace.jpg"),
        ("real_camera_dog.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/dog.jpg"),
        ("real_camera_cat_dog.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/cat-dog.jpg"),
        ("real_camera_mountains.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/mountains.jpg"),
        ("real_camera_street.jpg", "https://huggingface.co/datasets/mishig/sample_images/resolve/main/street.jpg"),
        ("real_camera_nature.jpg", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80"),
        ("real_camera_person.jpg", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"),
        ("real_camera_food.jpg", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80"),
        ("real_camera_building.jpg", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"),
        ("real_camera_landscape.jpg", "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80")
    ]

    print("\n--- 1. Downloading AI-Generated Test Images ---")
    for fname, url in ai_images:
        dest = os.path.join(uploads_dir, fname)
        if not os.path.exists(dest):
            download_file(url, dest)
        else:
            print(f"  [EXISTS] {fname}")

    print("\n--- 2. Downloading Real Genuine Camera Photographs ---")
    for fname, url in real_images:
        dest = os.path.join(uploads_dir, fname)
        if not os.path.exists(dest):
            download_file(url, dest)
        else:
            print(f"  [EXISTS] {fname}")

    # 3. Create Edited / Compressed / Resized Real Photographs
    print("\n--- 3. Generating Edited / Compressed / Resized Real Photographs ---")
    ref_real = os.path.join(uploads_dir, "real_camera_nature.jpg")
    if not os.path.exists(ref_real):
        ref_real = os.path.join(uploads_dir, "ai_specimen3.jpg")

    if os.path.exists(ref_real):
        img_bgr = cv2.imread(ref_real)

        # A. Heavy JPEG Compression (QF = 30)
        dest_q30 = os.path.join(uploads_dir, "real_edited_jpeg_q30.jpg")
        cv2.imwrite(dest_q30, img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 30])
        print(f"  [CREATED] real_edited_jpeg_q30.jpg (JPEG Compression QF=30)")

        # B. Medium JPEG Compression (QF = 50)
        dest_q50 = os.path.join(uploads_dir, "real_edited_jpeg_q50.jpg")
        cv2.imwrite(dest_q50, img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
        print(f"  [CREATED] real_edited_jpeg_q50.jpg (JPEG Compression QF=50)")

        # C. Downscale-Upscale (0.5x -> 1.0x)
        H, W = img_bgr.shape[:2]
        small = cv2.resize(img_bgr, (W//2, H//2), interpolation=cv2.INTER_AREA)
        upscaled = cv2.resize(small, (W, H), interpolation=cv2.INTER_LINEAR)
        dest_res = os.path.join(uploads_dir, "real_edited_resample_0.5x.jpg")
        cv2.imwrite(dest_res, upscaled)
        print(f"  [CREATED] real_edited_resample_0.5x.jpg (Downscale-Upscale Resample)")

        # D. Gaussian Blur Filter
        blurred = cv2.GaussianBlur(img_bgr, (5, 5), 1.5)
        dest_blur = os.path.join(uploads_dir, "real_edited_gaussian_blur.jpg")
        cv2.imwrite(dest_blur, blurred)
        print(f"  [CREATED] real_edited_gaussian_blur.jpg (Gaussian Blur)")

        # E. Color Jitter & Brightness Adjustment
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.15 + 10, 0, 255)
        edited_bgr = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        dest_edited = os.path.join(uploads_dir, "real_edited_color_adjust.jpg")
        cv2.imwrite(dest_edited, edited_bgr)
        print(f"  [CREATED] real_edited_color_adjust.jpg (Brightness & Saturation Adjustment)")

    print("\nDataset expansion complete.")

if __name__ == "__main__":
    create_benchmark_dataset()
