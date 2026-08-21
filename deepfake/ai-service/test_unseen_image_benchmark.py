import os
import csv
import cv2
import torch
import numpy as np
from PIL import Image

from image_ai_detector import ImageAIDetectorEngine

UNSEEN_GROUND_TRUTH = {
    # --- 10 AI GENERATED IMAGES ---
    "unseen_ai_01_animal.jpg": ("AI", "AI animal"),
    "unseen_ai_02_portrait.jpg": ("AI", "AI human portrait"),
    "unseen_ai_03_landscape.jpg": ("AI", "AI landscape"),
    "unseen_ai_04_city.jpg": ("AI", "AI city/street"),
    "unseen_ai_05_house_interior.jpg": ("AI", "AI house/interior"),
    "unseen_ai_06_food.jpg": ("AI", "AI food"),
    "unseen_ai_07_vehicle.jpg": ("AI", "AI vehicle"),
    "unseen_ai_08_artwork.jpg": ("AI", "AI artwork"),
    "unseen_ai_09_robot.jpg": ("AI", "AI robot/technology"),
    "unseen_ai_10_fantasy.jpg": ("AI", "AI fantasy scene"),

    # --- 5 REAL CAMERA PHOTOGRAPHS ---
    "unseen_real_11_animal.jpg": ("NATURAL", "Real animal photograph"),
    "unseen_real_12_human.jpg": ("NATURAL", "Real human photograph"),
    "unseen_real_13_landscape.jpg": ("NATURAL", "Real landscape photograph"),
    "unseen_real_14_building.jpg": ("NATURAL", "Real building/interior photograph"),
    "unseen_real_15_food.jpg": ("NATURAL", "Real object/food photograph")
}

def run_unseen_benchmark():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    unseen_dir = os.path.join(base_dir, "uploads", "unseen_benchmark")
    csv_path = os.path.join(base_dir, "unseen_image_benchmark_results.csv")

    print("=" * 100)
    print("UNSEEN 15-IMAGE BENCHMARK FOR PRODUCTION dima806 IMAGE DETECTOR")
    print("=" * 100)

    print("\nInitializing Production ImageAIDetectorEngine...")
    engine = ImageAIDetectorEngine()

    filenames = sorted(list(UNSEEN_GROUND_TRUTH.keys()))
    specimen_data = []

    for filename in filenames:
        filepath = os.path.join(unseen_dir, filename)
        gt, category = UNSEEN_GROUND_TRUTH[filename]

        if not os.path.exists(filepath):
            print(f"[Warning] File missing: {filepath}")
            continue

        bgr = cv2.imread(filepath)
        h, w = bgr.shape[:2]

        with open(filepath, "rb") as f:
            img_bytes = f.read()

        res = engine.predict_image_bytes(img_bytes, filename=filename)

        analyzed_patches = res.get("analyzedPatches", [])
        whole_prob = next((p["deepfakeProbability"] for p in analyzed_patches if p["patchId"] == "Canvas"), res["deepfakeProbability"])
        center_prob = next((p["deepfakeProbability"] for p in analyzed_patches if p["patchId"] == "Center Patch"), res["deepfakeProbability"])
        patch_probs = [p["deepfakeProbability"] for p in analyzed_patches]
        max_patch_prob = max(patch_probs) if patch_probs else res["deepfakeProbability"]

        specimen_data.append({
            "filename": filename,
            "category": category,
            "ground_truth": gt,
            "width": w,
            "height": h,
            "whole_probability": whole_prob,
            "center_probability": center_prob,
            "max_patch_probability": max_patch_prob,
            "final_probability": res["deepfakeProbability"],
            "prediction": res["prediction"],
            "confidence": res["confidence"]
        })

    print(f"\n[OK] Processed {len(specimen_data)} unseen specimens.")

    # -------------------------------------------------------------
    # 1. WRITE CSV REPORT
    # -------------------------------------------------------------
    csv_fields = [
        "filename", "category", "ground_truth", "width", "height",
        "whole_probability", "center_probability", "max_patch_probability",
        "final_probability", "prediction", "confidence"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=csv_fields)
        writer.writeheader()
        writer.writerows(specimen_data)

    print(f"[OK] Saved CSV report to: {csv_path}")

    # -------------------------------------------------------------
    # 2. PRINT INDIVIDUAL SPECIMEN RESULTS
    # -------------------------------------------------------------
    print("\n" + "=" * 115)
    print(f"{'Filename':<28} | {'Category':<22} | {'GT':<7} | {'Dims':<9} | {'Whole %':<8} | {'Center %':<9} | {'Final %':<8} | {'Prediction':<20}")
    print("-" * 115)
    for s in specimen_data:
        dims_str = f"{s['width']}x{s['height']}"
        print(f"{s['filename']:<28} | {s['category']:<22} | {s['ground_truth']:<7} | {dims_str:<9} | {s['whole_probability']*100:6.2f}% | {s['center_probability']*100:6.2f}% | {s['final_probability']*100:6.2f}% | {s['prediction']:<20}")
    print("=" * 115)

    # -------------------------------------------------------------
    # 3. METRIC CALCULATIONS
    # -------------------------------------------------------------
    total = len(specimen_data)
    ai_specs = [s for s in specimen_data if s["ground_truth"] == "AI"]
    real_specs = [s for s in specimen_data if s["ground_truth"] == "NATURAL"]

    total_ai = len(ai_specs)
    total_real = len(real_specs)

    tp, tn, fp, fn, unc = 0, 0, 0, 0, 0

    for s in specimen_data:
        pred = s["prediction"]
        gt = s["ground_truth"]

        if pred == "Likely AI Generated":
            if gt == "AI": tp += 1
            else: fp += 1
        elif pred == "Likely Natural":
            if gt == "NATURAL": tn += 1
            else: fn += 1
        else: # "Uncertain"
            unc += 1
            if gt == "AI": fn += 1

    decided = total - unc
    acc = (tp + tn) / total * 100.0
    dec_acc = (tp + tn) / decided * 100.0 if decided > 0 else 0.0
    prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
    rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

    fpr = (fp / total_real * 100.0) if total_real > 0 else 0.0
    fnr = (fn / total_ai * 100.0) if total_ai > 0 else 0.0

    print("\n" + "=" * 90)
    print("UNSEEN BENCHMARK METRICS SUMMARY (PRODUCTION 3-WAY THRESHOLDS)")
    print("=" * 90)
    print(f"  Total Specimen Count   : {total}")
    print(f"  AI Specimens           : {total_ai}")
    print(f"  Real Camera Photos     : {total_real}")
    print(f"  True Positives (TP)    : {tp}")
    print(f"  True Negatives (TN)    : {tn}")
    print(f"  False Positives (FP)   : {fp}")
    print(f"  False Negatives (FN)   : {fn}")
    print(f"  Uncertain Count        : {unc}")
    print(f"  Overall Accuracy       : {acc:.2f}%")
    print(f"  Decided Accuracy       : {dec_acc:.2f}% ({tp+tn}/{decided} decided)")
    print(f"  Precision              : {prec:.2f}%")
    print(f"  Recall                 : {rec:.2f}%")
    print(f"  F1 Score               : {f1:.2f}%")
    print(f"  AI False Positive Rate : {fpr:.2f}% ({fp}/{total_real})")
    print(f"  AI False Negative Rate : {fnr:.2f}% ({fn}/{total_ai})")

    # -------------------------------------------------------------
    # 4. CATEGORY-LEVEL GENERALIZATION BREAKDOWN
    # -------------------------------------------------------------
    print("\n" + "=" * 90)
    print("CATEGORY-LEVEL GENERALIZATION PERFORMANCE")
    print("=" * 90)
    for s in specimen_data:
        gt_icon = "[AI]" if s["ground_truth"] == "AI" else "[REAL]"
        detected_status = "DETECTED [OK]" if (s["prediction"] == "Likely AI Generated" and s["ground_truth"] == "AI") or (s["prediction"] == "Likely Natural" and s["ground_truth"] == "NATURAL") else f"MISSED ({s['prediction']})"
        print(f"  {s['category']:<32} {gt_icon:<7} | dima prob: {s['final_probability']*100:6.2f}% | Result: {detected_status}")

    # -------------------------------------------------------------
    # 5. OFFLINE THRESHOLD ANALYSIS (FOR ANALYSIS ONLY)
    # -------------------------------------------------------------
    print("\n" + "=" * 90)
    print("OFFLINE THRESHOLD SENSITIVITY ANALYSIS (ON UNSEEN TEST SET)")
    print("=" * 90)
    thresholds = [0.50, 0.70, 0.80, 0.90, 0.95]
    print(f"{'Threshold':<12} | {'Acc %':<7} | {'Prec %':<7} | {'Rec %':<7} | {'F1 %':<7} | {'FP':<4} | {'FN':<4}")
    print("-" * 70)

    for t in thresholds:
        t_tp, t_tn, t_fp, t_fn = 0, 0, 0, 0
        for s in specimen_data:
            prob = s["final_probability"]
            gt = s["ground_truth"]

            if prob >= t:
                if gt == "AI": t_tp += 1
                else: t_fp += 1
            else:
                if gt == "NATURAL": t_tn += 1
                else: t_fn += 1

        t_acc = (t_tp + t_tn) / total * 100.0
        t_prec = (t_tp / (t_tp + t_fp) * 100.0) if (t_tp + t_fp) > 0 else 0.0
        t_rec = (t_tp / (t_tp + t_fn) * 100.0) if (t_tp + t_fn) > 0 else 0.0
        t_f1 = (2 * t_prec * t_rec / (t_prec + t_rec)) if (t_prec + t_rec) > 0 else 0.0

        print(f"{t*100:5.0f}%        | {t_acc:6.2f} | {t_prec:6.2f} | {t_rec:6.2f} | {t_f1:6.2f} | {t_fp:<4} | {t_fn:<4}")

    print("=" * 90)

if __name__ == "__main__":
    run_unseen_benchmark()
