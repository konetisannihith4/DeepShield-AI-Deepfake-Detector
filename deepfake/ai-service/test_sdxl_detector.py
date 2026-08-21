"""
Organika/sdxl-detector Benchmark & Comparison Script
Standalone benchmark script — does NOT touch any production code, voice, video, or API endpoints.
"""

import os
import sys
import torch
import torch.nn.functional as F
from PIL import Image
import cv2
from transformers import AutoImageProcessor, AutoModelForImageClassification

# Import existing production detector for comparative benchmark only
from image_ai_detector import ImageAIDetectorEngine

MODEL_ID = "Organika/sdxl-detector"
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

TEST_IMAGES = [
    "ai_boy_portrait1.png",
    "ai_boy_portrait2.png",
    "ai_chatgpt.png",
    "ai_specimen3.jpg",
    "test.jpg.jpg"
]

def main():
    print("==================================================")
    print("      DEEPSHIELD ORGANIKA SDXL-DETECTOR BENCHMARK")
    print("==================================================")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Model ID : {MODEL_ID}")
    print(f"Device   : {device}")

    print("\nDownloading / Loading Organika SDXL Detector...")
    try:
        processor = AutoImageProcessor.from_pretrained(MODEL_ID)
        model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
        model.to(device)
        model.eval()
        print("[SUCCESS] Organika/sdxl-detector loaded successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to load Organika/sdxl-detector: {e}")
        sys.exit(1)

    id2label = model.config.id2label
    print(f"Model id2label mapping: {id2label}")

    # Organika/sdxl-detector id2label: {0: 'artificial', 1: 'human'}
    # 0 = artificial (AI / Fake)
    # 1 = human (Real / Natural)
    fake_idx = 0
    real_idx = 1
    for idx, lbl in id2label.items():
        lbl_s = str(lbl).lower()
        if "artificial" in lbl_s or "fake" in lbl_s or "ai" in lbl_s:
            fake_idx = int(idx)
        elif "human" in lbl_s or "real" in lbl_s:
            real_idx = int(idx)

    print(f"Mapped Fake Class Index: {fake_idx} ('{id2label[fake_idx]}')")
    print(f"Mapped Real Class Index: {real_idx} ('{id2label[real_idx]}')\n")

    # Initialize existing dima806 engine for comparison
    print("Initializing existing dima806 detector engine for comparison...")
    dima_engine = ImageAIDetectorEngine()
    print("Ready.\n")

    organika_results = []
    comparison_data = []

    for filename in TEST_IMAGES:
        img_path = os.path.join(UPLOADS_DIR, filename)
        print("--------------------------------------------------")
        print(f"IMAGE: {filename}")

        if not os.path.exists(img_path):
            print(f"[ERROR] File not found: {img_path}")
            continue

        # 1. PIL Image processing for Organika
        pil_image = Image.open(img_path).convert("RGB")
        inputs = processor(pil_image, return_tensors="pt").to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            probs = F.softmax(outputs.logits, dim=-1)[0]

        top_pred_idx = int(torch.argmax(probs).item())
        pred_label = id2label.get(top_pred_idx, f"Class {top_pred_idx}")
        confidence = float(probs[top_pred_idx].item())

        fake_prob = float(probs[fake_idx].item())
        real_prob = float(probs[real_idx].item())

        print(f"Prediction: {pred_label}")
        print(f"Confidence: {confidence:.4f} ({confidence * 100:.2f}%)")
        print("\nALL CLASS SCORES:")
        for idx_k, label_v in id2label.items():
            k_prob = float(probs[int(idx_k)].item())
            print(f"  {label_v}: {k_prob:.4f} ({k_prob * 100:.2f}%)")
        print(f"  Real (human): {real_prob * 100:.2f}%")
        print(f"  Fake (artificial): {fake_prob * 100:.2f}%")

        organika_results.append({
            "image": filename,
            "prediction": pred_label,
            "real_pct": round(real_prob * 100, 2),
            "fake_pct": round(fake_prob * 100, 2),
            "confidence": round(confidence * 100, 2)
        })

        # 2. Run dima806 engine for exact comparison
        cv2_image = cv2.imread(img_path)
        if cv2_image is not None:
            dima_res = dima_engine.analyze_image(cv2_image)
            d_pred = dima_res["prediction"]
            d_fake_pct = round(dima_res["deepfakeProbability"] * 100, 2)
            d_real_pct = round((1.0 - dima_res["deepfakeProbability"]) * 100, 2)
        else:
            d_pred = "Unknown"
            d_fake_pct = 0.0
            d_real_pct = 0.0

        # Agreement evaluation
        is_organika_fake = (pred_label == "artificial" or fake_prob >= 0.50)
        is_dima_fake = (d_pred == "Likely AI Generated" or d_fake_pct >= 50.0)

        agree = (is_organika_fake == is_dima_fake)
        agreement_str = "AGREE" if agree else "DISAGREE"

        comparison_data.append({
            "image": filename,
            "dima_result": f"{d_pred} ({d_fake_pct}% AI)",
            "organika_result": f"{pred_label} ({fake_prob * 100:.2f}% Fake)",
            "agreement": agreement_str
        })

    # Summary Benchmark Table
    print("\n==================================================")
    print("ORGANIKA SDXL DETECTOR BENCHMARK")
    print("==================================================")
    header_fmt = "{:<22} | {:<16} | {:<8} | {:<8} | {:<10}"
    print(header_fmt.format("IMAGE", "PREDICTION", "REAL %", "FAKE %", "CONFIDENCE"))
    print("-" * 75)
    for item in organika_results:
        print(header_fmt.format(
            item["image"],
            item["prediction"],
            f"{item['real_pct']}%",
            f"{item['fake_pct']}%",
            f"{item['confidence']}%"
        ))

    # Detailed Comparison Table against dima806
    print("\n==================================================")
    print("MODEL COMPARISON: dima806 vs Organika SDXL Detector")
    print("==================================================")
    comp_fmt = "{:<22} | {:<32} | {:<28} | {:<10}"
    print(comp_fmt.format("IMAGE", "dima806 RESULT", "ORGANIKA RESULT", "AGREEMENT"))
    print("-" * 97)
    for comp in comparison_data:
        print(comp_fmt.format(
            comp["image"],
            comp["dima_result"],
            comp["organika_result"],
            comp["agreement"]
        ))

    print("==================================================")

if __name__ == "__main__":
    main()
