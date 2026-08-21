import os
import urllib.request

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

def add_more_ai_images():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    more_ai = [
        ("ai_controlnet_out.png", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/controlnet-out.png"),
        ("ai_inpaint_out.png", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/inpaint_out.png"),
        ("ai_dreambooth_out.png", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/dreambooth-out.png"),
        ("ai_ip_adapter_out.png", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/ip_adapter_out.png"),
        ("ai_sdxl_turbo.png", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/sdxl-turbo.png"),
        ("ai_lcm_sdxl.png", "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/lcm-sdxl.png")
    ]

    for fname, url in more_ai:
        dest = os.path.join(uploads_dir, fname)
        if not os.path.exists(dest):
            download_file(url, dest)

if __name__ == "__main__":
    add_more_ai_images()
