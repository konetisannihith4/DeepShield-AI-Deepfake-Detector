import os
from huggingface_hub import hf_hub_download, snapshot_download

REPO_ID = "xRayon/convnext-ai-images-detector"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_DIR = os.path.join(BASE_DIR, "models", "xrayon_convnext")

os.makedirs(TARGET_DIR, exist_ok=True)

print(f"Downloading xRayon ConvNeXtV2 repository from HuggingFace ({REPO_ID})...")

try:
    snapshot_path = snapshot_download(
        repo_id=REPO_ID,
        local_dir=TARGET_DIR,
        local_dir_use_symlinks=False
    )
    print(f"[OK] Downloaded snapshot to: {snapshot_path}")

    # Verify checkpoint_phase2.pth
    ckpt_path = os.path.join(TARGET_DIR, "checkpoint_phase2.pth")
    if os.path.exists(ckpt_path):
        size_mb = os.path.getsize(ckpt_path) / (1024 * 1024)
        print(f"[VERIFIED] checkpoint_phase2.pth exists! Size: {size_mb:.2f} MB")
    else:
        print("[WARNING] checkpoint_phase2.pth not found in snapshot root. Searching directory...")
        for root, dirs, files in os.walk(TARGET_DIR):
            for f in files:
                if f.endswith(".pth") or f.endswith(".pt") or f.endswith(".bin"):
                    print(f"  Found file: {os.path.join(root, f)} ({os.path.getsize(os.path.join(root, f))/(1024*1024):.2f} MB)")
except Exception as e:
    print(f"[Error downloading xRayon checkpoint]: {e}")
