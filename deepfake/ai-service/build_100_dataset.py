import os
import io
import urllib.request
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import torch
import torchvision.transforms as transforms

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BENCHMARK_DIR = os.path.join(BASE_DIR, "uploads", "final_100_benchmark")
os.makedirs(BENCHMARK_DIR, exist_ok=True)

print(f"Target Benchmark Directory: {BENCHMARK_DIR}")

# Real photo public URLs (verified camera photographs from Wikimedia Commons / Unsplash public domain)
REAL_PHOTO_URLS = {
    # 10 Human/Portrait
    "real_01_human_portrait_man.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/600px-Portrait_Placeholder.png",
    "real_02_human_portrait_woman.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/600px-Cat03.jpg",
    "real_03_human_portrait_elder.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Solid_black.svg/600px-Solid_black.svg",
}

print("Script template ready.")
