import os
import csv
import torch
import numpy as np
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

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

def run_secondary_escalation():
    cand_model_id = "ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    csv_path = os.path.join(base_dir, "secondary_escalation_results.csv")

    print("=" * 80)
    print("SECONDARY-ESCALATION STRATEGY BENCHMARK (26 SPECIMENS)")
    print("=" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load Engines & Models
    print("Initializing Production ImageAIDetectorEngine...")
    dima_engine = ImageAIDetectorEngine()

    print("Loading Secondary Candidate Swin Model...")
    processor = AutoImageProcessor.from_pretrained(cand_model_id)
    cand_model = AutoModelForImageClassification.from_pretrained(cand_model_id)
    cand_model.to(device)
    cand_model.eval()

    filenames = sorted(list(KNOWN_GROUND_TRUTH.keys()))
    specimen_data = []

    print("\nExtracting Probabilities across all 26 Specimens...")
    for filename in filenames:
        filepath = os.path.join(uploads_dir, filename)
        gt = KNOWN_GROUND_TRUTH[filename]

        # dima806 Inference
        with open(filepath, "rb") as f:
            img_bytes = f.read()
        dima_res = dima_engine.predict_image_bytes(img_bytes, filename=filename)
        dima_prob = dima_res.get("deepfakeProbability", 0.0)

        # Candidate Swin Inference
        pil_img = Image.open(filepath).convert("RGB")
        inputs = processor(images=pil_img, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = cand_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits[0], dim=-1)
        cand_prob = float(probs[0].item()) # index 0 = 'ai_gen'

        specimen_data.append({
            "filename": filename,
            "ground_truth": gt,
            "dima_prob": dima_prob,
            "cand_prob": cand_prob
        })

    print(f"[OK] Extracted probabilities for {len(specimen_data)} specimens.")

    cand_thresholds = [0.90, 0.95, 0.98, 0.99, 0.995, 0.999]
    total_specimens = len(specimen_data)
    results = []

    # 1. Evaluate Rule 1 (Baseline - Primary Only)
    tp, tn, fp, fn, unc = 0, 0, 0, 0, 0
    for s in specimen_data:
        d = s["dima_prob"]
        gt = s["ground_truth"]
        if d >= 0.95:
            pred = "AI GENERATED"
        elif d <= 0.50:
            pred = "NATURAL"
        else:
            pred = "UNCERTAIN"

        if pred == "AI GENERATED":
            if gt == "AI": tp += 1
            else: fp += 1
        elif pred == "NATURAL":
            if gt == "NATURAL": tn += 1
            else: fn += 1
        else:
            unc += 1
            if gt == "AI": fn += 1

    decided = tp + tn + fp + (fn - unc) # decided cases
    cov = ((total_specimens - unc) / total_specimens) * 100.0
    acc = (tp + tn) / total_specimens * 100.0
    prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
    rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

    results.append({
        "rule": "RULE 1 — PRIMARY ONLY",
        "cand_threshold": "N/A",
        "accuracy": f"{acc:.2f}",
        "precision": f"{prec:.2f}",
        "recall": f"{rec:.2f}",
        "f1": f"{f1:.2f}",
        "TP": tp, "TN": tn, "FP": fp, "FN": fn,
        "UNCERTAIN_count": unc,
        "coverage": f"{cov:.2f}",
        "raw_fp": fp, "raw_f1": f1, "raw_rec": rec
    })

    # 2. Evaluate Rules 2, 3, 4 across candidate thresholds
    for r_num in [2, 3, 4]:
        for t_cand in cand_thresholds:
            tp, tn, fp, fn, unc = 0, 0, 0, 0, 0

            for s in specimen_data:
                d = s["dima_prob"]
                c = s["cand_prob"]
                gt = s["ground_truth"]

                if r_num == 2:
                    # RULE 2 — SECONDARY HIGH-CONFIDENCE OVERRIDE (Flags for Review if cand >= t_cand)
                    if d >= 0.95:
                        pred = "AI GENERATED"
                    elif d <= 0.50 and c >= t_cand:
                        pred = "SECONDARY REVIEW"
                    elif d <= 0.50:
                        pred = "NATURAL"
                    else:
                        pred = "UNCERTAIN"
                elif r_num == 3:
                    # RULE 3 — SECONDARY AI SIGNAL (Directly flags AI if dima <= 0.50 and cand >= t_cand)
                    if d >= 0.95:
                        pred = "AI GENERATED"
                    elif d <= 0.50 and c >= t_cand:
                        pred = "AI GENERATED"
                    elif d <= 0.50:
                        pred = "NATURAL"
                    else:
                        pred = "UNCERTAIN"
                elif r_num == 4:
                    # RULE 4 — VERY HIGH SECONDARY SIGNAL (Directly flags AI if cand >= t_cand regardless of dima)
                    if d >= 0.95:
                        pred = "AI GENERATED"
                    elif c >= t_cand:
                        pred = "AI GENERATED"
                    elif d <= 0.50:
                        pred = "NATURAL"
                    else:
                        pred = "UNCERTAIN"

                # Metric Assignment
                if pred == "AI GENERATED":
                    if gt == "AI": tp += 1
                    else: fp += 1
                elif pred == "NATURAL":
                    if gt == "NATURAL": tn += 1
                    else: fn += 1
                elif pred == "SECONDARY REVIEW":
                    unc += 1
                    if gt == "AI": fn += 1
                    elif gt == "NATURAL": fp += 1 # Flagged for review count
                else: # UNCERTAIN
                    unc += 1
                    if gt == "AI": fn += 1

            cov = ((total_specimens - unc) / total_specimens) * 100.0
            acc = (tp + tn) / total_specimens * 100.0
            prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
            rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
            f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

            r_name = f"RULE {r_num} (cand >= {t_cand})"
            results.append({
                "rule": r_name,
                "cand_threshold": f"{t_cand:.3f}",
                "accuracy": f"{acc:.2f}",
                "precision": f"{prec:.2f}",
                "recall": f"{rec:.2f}",
                "f1": f"{f1:.2f}",
                "TP": tp, "TN": tn, "FP": fp, "FN": fn,
                "UNCERTAIN_count": unc,
                "coverage": f"{cov:.2f}",
                "raw_fp": fp, "raw_f1": f1, "raw_rec": rec
            })

    # Sort CSV results by FP asc, F1 desc, Recall desc
    results.sort(key=lambda x: (x["raw_fp"], -x["raw_f1"], -x["raw_rec"]))

    # Write CSV
    fieldnames = [
        "rule", "cand_threshold", "accuracy", "precision",
        "recall", "f1", "TP", "TN", "FP", "FN",
        "UNCERTAIN_count", "coverage"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow({k: r[k] for k in fieldnames})

    print(f"[OK] Saved secondary escalation CSV to: {csv_path}")

    # -------------------------------------------------------------
    # DETAILED COMPARISON TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 100)
    print("SECONDARY-ESCALATION CONFIGURATIONS (SORTED BY FP ASC, F1 DESC, RECALL DESC)")
    print("=" * 100)
    header = f"{'Rule Description':<32} | {'cand_th':<7} | {'Acc %':<7} | {'Prec %':<7} | {'Rec %':<7} | {'F1 %':<7} | {'FP':<3} | {'FN':<3} | {'UNC':<3} | {'Cov %':<7}"
    print(header)
    print("-" * 100)
    for r in results:
        print(f"{r['rule']:<32} | {r['cand_threshold']:<7} | {r['accuracy']:<7} | {r['precision']:<7} | {r['recall']:<7} | {r['f1']:<7} | {r['FP']:<3} | {r['FN']:<3} | {r['UNCERTAIN_count']:<3} | {r['coverage']:<7}")

    print("=" * 100)

    # -------------------------------------------------------------
    # CRITICAL FALSE POSITIVE & AI RECOVERY TEST
    # -------------------------------------------------------------
    print("\n" + "=" * 90)
    print("1. CRITICAL NATURAL SPECIMENS FALSE POSITIVE BREAKDOWN BY CANDIDATE THRESHOLD")
    print("=" * 90)

    nat_specimens = [s for s in specimen_data if s["ground_truth"] == "NATURAL"]
    for t_cand in cand_thresholds:
        fp_natural = [s["filename"] for s in nat_specimens if s["cand_prob"] >= t_cand]
        print(f"\n  Candidate Threshold >= {t_cand:.3f}: (False Positives: {len(fp_natural)}/{len(nat_specimens)})")
        if fp_natural:
            for fname in fp_natural:
                c_val = next(s["cand_prob"] for s in nat_specimens if s["filename"] == fname)
                print(f"    - [FP] {fname:<30} (Candidate AI score: {c_val*100:6.2f}%)")
        else:
            print("    - [SAFE] Zero natural specimens falsely flagged!")

    print("\n" + "=" * 90)
    print("2. CRITICAL AI RECOVERY SPECIMENS BREAKDOWN")
    print("=" * 90)

    ai_recovery_files = ["ai_boy_portrait2.png", "ai_sdxl_landscape.jpg", "ai_sdxl_img2img.jpg", "ai_gan_bedroom.jpg"]
    print(f"{'Filename':<25} | {'dima %':<8} | {'cand %':<8} | {'Recovered @ 0.98':<16} | {'Recovered @ 0.995':<16}")
    print("-" * 80)
    for fname in ai_recovery_files:
        s = next(item for item in specimen_data if item["filename"] == fname)
        rec_98 = "YES [OK]" if s["cand_prob"] >= 0.98 else "NO [MISS]"
        rec_995 = "YES [OK]" if s["cand_prob"] >= 0.995 else "NO [MISS]"
        print(f"{fname:<25} | {s['dima_prob']*100:6.2f}% | {s['cand_prob']*100:6.2f}% | {rec_98:<16} | {rec_995:<16}")

    print("=" * 80)

if __name__ == "__main__":
    run_secondary_escalation()
