import os
import csv
import cv2
import torch

from image_ai_detector import ImageAIDetectorEngine

# FULL 41 SPECIMEN GROUND TRUTH MAPPING
PREVIOUS_26_SPECIMENS = {
    # 1. AI Images (10)
    "ai_boy_portrait1.png": ("AI", "Previous Benchmark"),
    "ai_boy_portrait1_crop.png": ("AI", "Previous Benchmark"),
    "ai_boy_portrait1_jpeg_q50.jpg": ("AI", "Previous Benchmark"),
    "ai_boy_portrait2.png": ("AI", "Previous Benchmark"),
    "ai_chatgpt.png": ("AI", "Previous Benchmark"),
    "ai_chatgpt_color_jitter.png": ("AI", "Previous Benchmark"),
    "ai_chatgpt_resampled_0.5x.png": ("AI", "Previous Benchmark"),
    "ai_gan_bedroom.jpg": ("AI", "Previous Benchmark"),
    "ai_sdxl_img2img.jpg": ("AI", "Previous Benchmark"),
    "ai_sdxl_landscape.jpg": ("AI", "Previous Benchmark"),

    # 2. Real Photos (11)
    "ai_specimen3.jpg": ("NATURAL", "Previous Benchmark"),
    "test.jpg.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_building.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_cat.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_food.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_landscape.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_nature.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_palace.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_person.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_teapot.jpg": ("NATURAL", "Previous Benchmark"),
    "real_camera_tiger.jpg": ("NATURAL", "Previous Benchmark"),

    # 3. Edited Real Photos (5)
    "real_edited_color_adjust.jpg": ("NATURAL", "Previous Benchmark"),
    "real_edited_gaussian_blur.jpg": ("NATURAL", "Previous Benchmark"),
    "real_edited_jpeg_q30.jpg": ("NATURAL", "Previous Benchmark"),
    "real_edited_jpeg_q50.jpg": ("NATURAL", "Previous Benchmark"),
    "real_edited_resample_0.5x.jpg": ("NATURAL", "Previous Benchmark")
}

UNSEEN_15_SPECIMENS = {
    "unseen_ai_01_animal.jpg": ("AI", "Unseen AI animal"),
    "unseen_ai_02_portrait.jpg": ("AI", "Unseen AI human portrait"),
    "unseen_ai_03_landscape.jpg": ("AI", "Unseen AI landscape"),
    "unseen_ai_04_city.jpg": ("AI", "Unseen AI city/street"),
    "unseen_ai_05_house_interior.jpg": ("AI", "Unseen AI house/interior"),
    "unseen_ai_06_food.jpg": ("AI", "Unseen AI food"),
    "unseen_ai_07_vehicle.jpg": ("AI", "Unseen AI vehicle"),
    "unseen_ai_08_artwork.jpg": ("AI", "Unseen AI artwork"),
    "unseen_ai_09_robot.jpg": ("AI", "Unseen AI robot/technology"),
    "unseen_ai_10_fantasy.jpg": ("AI", "Unseen AI fantasy scene"),

    "unseen_real_11_animal.jpg": ("NATURAL", "Unseen Real animal photo"),
    "unseen_real_12_human.jpg": ("NATURAL", "Unseen Real human photo"),
    "unseen_real_13_landscape.jpg": ("NATURAL", "Unseen Real landscape photo"),
    "unseen_real_14_building.jpg": ("NATURAL", "Unseen Real building photo"),
    "unseen_real_15_food.jpg": ("NATURAL", "Unseen Real food photo")
}

def calc_metrics(specimens):
    total = len(specimens)
    if total == 0:
        return {}

    ai_list = [s for s in specimens if s["ground_truth"] == "AI"]
    real_list = [s for s in specimens if s["ground_truth"] == "NATURAL"]

    total_ai = len(ai_list)
    total_real = len(real_list)

    tp, tn, fp, fn, unc = 0, 0, 0, 0, 0

    for s in specimens:
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

    return {
        "total": total,
        "total_ai": total_ai,
        "total_real": total_real,
        "TP": tp, "TN": tn, "FP": fp, "FN": fn, "UNC": unc,
        "accuracy": acc, "decided_accuracy": dec_acc,
        "precision": prec, "recall": rec, "f1": f1,
        "FPR": fpr, "FNR": fnr
    }

def run_benchmark():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    unseen_dir = os.path.join(uploads_dir, "unseen_benchmark")
    csv_path = os.path.join(base_dir, "xrayon_41_image_benchmark.csv")

    print("=" * 110)
    print("xRayon ConvNeXtV2 Phase-2 DETECTOR — FULL 41-IMAGE BENCHMARK")
    print("=" * 110)

    print("\nInitializing Production ImageAIDetectorEngine...")
    engine = ImageAIDetectorEngine()

    all_results = []
    prev_26_results = []
    unseen_15_results = []

    # 1. Process Previous 26 Specimens
    print("\n[Phase 1] Processing 26 Previous Benchmark Specimens...")
    for fname, (gt, cat) in sorted(PREVIOUS_26_SPECIMENS.items()):
        filepath = os.path.join(uploads_dir, fname)
        with open(filepath, "rb") as f:
            img_bytes = f.read()

        res = engine.predict_image_bytes(img_bytes, filename=fname)
        ai_p = res["deepfakeProbability"]
        real_p = round(float(max(0.0, 1.0 - ai_p)), 4)
        pred = res["prediction"]
        conf = res["confidence"]

        # Classification outcome tag
        if pred == "Likely AI Generated" and gt == "AI": outcome = "TP [OK]"
        elif pred == "Likely Natural" and gt == "NATURAL": outcome = "TN [OK]"
        elif pred == "Likely AI Generated" and gt == "NATURAL": outcome = "FP [ERROR]"
        elif pred == "Likely Natural" and gt == "AI": outcome = "FN [MISS]"
        else: outcome = f"UNC ({gt})"

        item = {
            "filename": fname,
            "set_group": "Previous 26",
            "category": cat,
            "ground_truth": gt,
            "AI_probability": f"{ai_p*100:.2f}%",
            "real_probability": f"{real_p*100:.2f}%",
            "raw_ai_prob": ai_p,
            "prediction": pred,
            "confidence": f"{conf*100:.2f}%",
            "outcome": outcome
        }
        all_results.append(item)
        prev_26_results.append(item)

    # 2. Process Unseen 15 Specimens
    print("[Phase 2] Processing 15 Unseen Benchmark Specimens...")
    for fname, (gt, cat) in sorted(UNSEEN_15_SPECIMENS.items()):
        filepath = os.path.join(unseen_dir, fname)
        with open(filepath, "rb") as f:
            img_bytes = f.read()

        res = engine.predict_image_bytes(img_bytes, filename=fname)
        ai_p = res["deepfakeProbability"]
        real_p = round(float(max(0.0, 1.0 - ai_p)), 4)
        pred = res["prediction"]
        conf = res["confidence"]

        if pred == "Likely AI Generated" and gt == "AI": outcome = "TP [OK]"
        elif pred == "Likely Natural" and gt == "NATURAL": outcome = "TN [OK]"
        elif pred == "Likely AI Generated" and gt == "NATURAL": outcome = "FP [ERROR]"
        elif pred == "Likely Natural" and gt == "AI": outcome = "FN [MISS]"
        else: outcome = f"UNC ({gt})"

        item = {
            "filename": fname,
            "set_group": "Unseen 15",
            "category": cat,
            "ground_truth": gt,
            "AI_probability": f"{ai_p*100:.2f}%",
            "real_probability": f"{real_p*100:.2f}%",
            "raw_ai_prob": ai_p,
            "prediction": pred,
            "confidence": f"{conf*100:.2f}%",
            "outcome": outcome
        }
        all_results.append(item)
        unseen_15_results.append(item)

    # -------------------------------------------------------------
    # WRITE CSV REPORT
    # -------------------------------------------------------------
    csv_fields = [
        "filename", "set_group", "category", "ground_truth",
        "AI_probability", "real_probability", "prediction", "confidence", "outcome"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields)
        writer.writeheader()
        for r in all_results:
            writer.writerow({k: r[k] for k in csv_fields})

    print(f"\n[OK] Saved 41-specimen CSV report to: {csv_path}")

    # -------------------------------------------------------------
    # PRINT RESULTS TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 115)
    print(f"{'Filename':<30} | {'Group':<12} | {'GT':<7} | {'AI Prob':<9} | {'Real Prob':<9} | {'Prediction':<20} | {'Outcome':<10}")
    print("-" * 115)
    for r in all_results:
        print(f"{r['filename']:<30} | {r['set_group']:<12} | {r['ground_truth']:<7} | {r['AI_probability']:<9} | {r['real_probability']:<9} | {r['prediction']:<20} | {r['outcome']:<10}")
    print("=" * 115)

    # -------------------------------------------------------------
    # METRICS REPORTING
    # -------------------------------------------------------------
    m_all = calc_metrics(all_results)
    m_prev = calc_metrics(prev_26_results)
    m_uns = calc_metrics(unseen_15_results)

    print("\n" + "=" * 90)
    print("COMPLETE BENCHMARK METRICS SUMMARY (xRayon ConvNeXtV2 Phase-2)")
    print("=" * 90)

    print("\n1. OVERALL 41-SPECIMEN BENCHMARK (Previous 26 + Unseen 15):")
    print(f"   Accuracy       : {m_all['accuracy']:.2f}% (Decided Acc: {m_all['decided_accuracy']:.2f}%)")
    print(f"   Precision      : {m_all['precision']:.2f}%")
    print(f"   Recall         : {m_all['recall']:.2f}%")
    print(f"   F1 Score       : {m_all['f1']:.2f}%")
    print(f"   TP: {m_all['TP']} | TN: {m_all['TN']} | FP: {m_all['FP']} | FN: {m_all['FN']} | UNCERTAIN: {m_all['UNC']}")
    print(f"   False Pos Rate : {m_all['FPR']:.2f}% | False Neg Rate: {m_all['FNR']:.2f}%")

    print("\n2. PREVIOUS 26 BENCHMARK SPECIMENS:")
    print(f"   Accuracy       : {m_prev['accuracy']:.2f}%")
    print(f"   Precision      : {m_prev['precision']:.2f}%")
    print(f"   Recall         : {m_prev['recall']:.2f}%")
    print(f"   F1 Score       : {m_prev['f1']:.2f}%")
    print(f"   TP: {m_prev['TP']} | TN: {m_prev['TN']} | FP: {m_prev['FP']} | FN: {m_prev['FN']} | UNCERTAIN: {m_prev['UNC']}")

    print("\n3. UNSEEN 15 BENCHMARK SPECIMENS:")
    print(f"   Accuracy       : {m_uns['accuracy']:.2f}%")
    print(f"   Precision      : {m_uns['precision']:.2f}%")
    print(f"   Recall (UNSEEN AI RECALL) : {m_uns['recall']:.2f}% ({m_uns['TP']}/{m_uns['total_ai']} AI detected)")
    print(f"   F1 Score       : {m_uns['f1']:.2f}%")
    print(f"   TP: {m_uns['TP']} | TN: {m_uns['TN']} | FP: {m_uns['FP']} | FN: {m_uns['FN']} | UNCERTAIN: {m_uns['UNC']}")
    print("=" * 90)

if __name__ == "__main__":
    run_benchmark()
