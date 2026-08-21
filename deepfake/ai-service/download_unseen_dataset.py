import os
import requests
from PIL import Image
import io

UNSEEN_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "unseen_benchmark")
os.makedirs(UNSEEN_DIR, exist_ok=True)

# Guaranteed direct download URLs for HuggingFace diffusers & Unsplash high-res photos
DATASET_SPECIMENS = {
    # --- 10 AI GENERATED IMAGES ---
    "unseen_ai_01_animal.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/cat.png",
        "gt": "AI",
        "category": "AI animal"
    },
    "unseen_ai_02_portrait.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/sdxl-text2img.png",
        "gt": "AI",
        "category": "AI human portrait"
    },
    "unseen_ai_03_landscape.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/landscape.png",
        "gt": "AI",
        "category": "AI landscape"
    },
    "unseen_ai_04_city.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/inpaint-out.png",
        "gt": "AI",
        "category": "AI city/street"
    },
    "unseen_ai_05_house_interior.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/controlnet-img2img-out.png",
        "gt": "AI",
        "category": "AI house/interior"
    },
    "unseen_ai_06_food.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/t2i_adapter_out.png",
        "gt": "AI",
        "category": "AI food"
    },
    "unseen_ai_07_vehicle.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/kitti_out.png",
        "gt": "AI",
        "category": "AI vehicle"
    },
    "unseen_ai_08_artwork.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/painting.png",
        "gt": "AI",
        "category": "AI artwork"
    },
    "unseen_ai_09_robot.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/depth2img-out.png",
        "gt": "AI",
        "category": "AI robot/technology"
    },
    "unseen_ai_10_fantasy.jpg": {
        "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/anime_girl.png",
        "gt": "AI",
        "category": "AI fantasy scene"
    },

    # --- 5 REAL CAMERA PHOTOGRAPHS ---
    "unseen_real_11_animal.jpg": {
        "url": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80",
        "gt": "NATURAL",
        "category": "Real animal photograph"
    },
    "unseen_real_12_human.jpg": {
        "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
        "gt": "NATURAL",
        "category": "Real human photograph"
    },
    "unseen_real_13_landscape.jpg": {
        "url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
        "gt": "NATURAL",
        "category": "Real landscape photograph"
    },
    "unseen_real_14_building.jpg": {
        "url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "gt": "NATURAL",
        "category": "Real building/interior photograph"
    },
    "unseen_real_15_food.jpg": {
        "url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
        "gt": "NATURAL",
        "category": "Real object/food photograph"
    }
}

def populate_unseen_dataset():
    print("Downloading 15 Unseen Benchmark Specimens to uploads/unseen_benchmark/...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    # Clean fallback files if any
    for f in os.listdir(UNSEEN_DIR):
        if f.startswith("unseen_ai_02_portrait") or f.endswith(".png"):
            try: os.remove(os.path.join(UNSEEN_DIR, f))
            except: pass

    for fname, info in DATASET_SPECIMENS.items():
        out_path = os.path.join(UNSEEN_DIR, fname)
        url = info["url"]
        try:
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
                img.save(out_path)
                print(f"  [OK Downloaded] {fname:<30} ({info['category']:<25}) Size: {img.size}")
            else:
                print(f"  [HTTP Error {resp.status_code}] {fname}")
        except Exception as e:
            print(f"  [Download Error: {e}] {fname}")

if __name__ == "__main__":
    populate_unseen_dataset()
