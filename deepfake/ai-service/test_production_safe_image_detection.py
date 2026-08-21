import os
import csv
import torch
from image_ai_detector import ImageAIDetectorEngine

KNOWN_GROUND_TRUTH = {
    # 1. AI-Generated Images (10)
    "ai_boy_portrait1.png": "AI",
    "ai_boy_portrait1_crop.png": "AI",
    "ai_boy_portrait1_jpeg_q50.jpg": "AI",
    "ai_boy_portrait2.png": "AI",
    "ai_chatgpt.png": "AI",
    "ai_chatgpt_color_jitter.png": "AI",
    "ai_chatgpt_resampled_0.5x.png": "AI",
    "ai_gan_bedroom.jpg": "AI",
    "ai_sdxl_img2img.jpg": "AI",
    "ai_sdxl_landscape.jpg": "AI",

    # 2. Real Genuine Camera Photographs (11)
    "ai_specimen3.jpg": "NATURAL",
    "test.jpg.jpg": "NATURAL",
    "real_camera_building.jpg": "NATURAL",
    "real_camera_cat.jpg": "NATURAL",
    "real_camera_food.jpg": "NATURAL",
    "real_camera_landscape.jpg": "NATURAL",
    "real_camera_nature.jpg": "NATURAL",
    "real_camera_palace.jpg": "NATURAL",
    "real_camera_person.jpg": "NATURAL",
    "real_camera_teapot.jpg": "NATURAL",
    "real_camera_tiger.jpg": "NATURAL",

    # 3. Edited / Compressed / Resized Real Photographs (5)
    "real_edited_color_adjust.jpg": "NATURAL",
    "real_edited_gaussian_blur.jpg": "NATURAL",
    "real_edited_jpeg_q30.jpg": "NATURAL",
    "real_edited_jpeg_q50.jpg": "NATURAL",
    "real_edited_resample_0.5x.jpg": "NATURAL"
}

def verify_safe_production_detector():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    csv_path = os.path.join(base_dir, "safe_image_detection_report.csv")

    print("=" * 90)
    print("PRODUCTION SAFE THREE-WAY IMAGE DETECTION BENCHMARK (26 SPECIMENS)")
    print("=" * 90)

    engine = ImageAIDetectorEngine()
    filenames = sorted(list(KNOWN_GROUND_TRUTH.keys()))
    report_rows = []

    tp, tn, fp, fn, unc = 0, 0, 0, 0, 0

    for filename in filenames:
        filepath = os.path.join(uploads_dir, filename)
        gt = KNOWN_GROUND_TRUTH[filename]

        with open(filepath, "rb") as f:
            img_bytes = f.read()

        res = engine.predict_image_bytes(img_bytes, filename=filename)

        prob = res["deepfakeProbability"]
        pred = res["prediction"]
        conf = res["confidence"]

        # Before prediction logic (2-way with threshold > 0.60 / < 0.40):
        if prob > 0.60:
            old_pred = "Likely AI Generated"
        elif prob < 0.40:
            old_pred = "Likely Natural"
        else:
            old_pred = "Uncertain"

        # Three-way Metrics:
        if pred == "Likely AI Generated":
            if gt == "AI": tp += 1
            else: fp += 1
        elif pred == "Likely Natural":
            if gt == "NATURAL": tn += 1
            else: fn += 1
        else: # "Uncertain"
            unc += 1
            if gt == "AI": fn += 1 # missed AI
            elif gt == "NATURAL": pass # safe natural uncertainty

        report_rows.append({
            "filename": filename,
            "ground_truth": gt,
            "probability": f"{prob*100:.2f}%",
            "confidence": f"{conf*100:.2f}%",
            "old_prediction": old_pred,
            "new_prediction": pred
        })

    total = len(filenames)
    decided = total - unc
    acc = (tp + tn) / total * 100.0
    dec_acc = (tp + tn) / decided * 100.0 if decided > 0 else 0.0
    prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
    rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

    # Write CSV
    fieldnames = ["filename", "ground_truth", "probability", "confidence", "old_prediction", "new_prediction"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"\n[OK] Saved benchmark report CSV to: {csv_path}")

    # Print Table
    print("\n" + "=" * 105)
    print(f"{'Filename':<30} | {'GT':<7} | {'dima Prob':<9} | {'Conf %':<7} | {'Old 2-Way Pred':<20} | {'New 3-Way Pred':<20}")
    print("-" * 105)
    for r in report_rows:
        print(f"{r['filename']:<30} | {r['ground_truth']:<7} | {r['probability']:<9} | {r['confidence']:<7} | {r['old_prediction']:<20} | {r['new_prediction']:<20}")
    print("=" * 105)

    print(f"\nSUMMARY METRICS (26 SPECIMENS):")
    print(f"  Overall Accuracy : {acc:.2f}%")
    print(f"  Decided Accuracy : {dec_acc:.2f}% ({tp+tn}/{decided} decided)")
    print(f"  Precision        : {prec:.2f}%")
    print(f"  Recall           : {rec:.2f}%")
    print(f"  F1 Score         : {f1:.2f}%")
    print(f"  True Positives   : {tp}")
    print(f"  True Negatives   : {tn}")
    print(f"  False Positives  : {fp}")
    print(f"  False Negatives  : {fn}")
    print(f"  Uncertain Count  : {unc}")
    print("=" * 90)

if __name__ == "__main__":
    verify_safe_production_detector()
