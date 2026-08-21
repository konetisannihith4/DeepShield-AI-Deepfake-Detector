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

def run_three_way_calibration():
    cand_model_id = "ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    csv_path = os.path.join(base_dir, "three_way_threshold_search.csv")

    print("=" * 80)
    print("UNCERTAINTY CALIBRATION & THREE-WAY THRESHOLD SEARCH (26 SPECIMENS)")
    print("=" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load Production dima806 Engine and Candidate Swin Model
    print("Initializing Production ImageAIDetectorEngine...")
    dima_engine = ImageAIDetectorEngine()

    print("Loading Secondary Candidate Model (Swin)...")
    processor = AutoImageProcessor.from_pretrained(cand_model_id)
    cand_model = AutoModelForImageClassification.from_pretrained(cand_model_id)
    cand_model.to(device)
    cand_model.eval()

    filenames = sorted(list(KNOWN_GROUND_TRUTH.keys()))
    specimen_data = []

    print("\nCollecting Inference Probabilities across all 26 Specimens...")
    for filename in filenames:
        filepath = os.path.join(uploads_dir, filename)
        gt = KNOWN_GROUND_TRUTH[filename]

        # dima806 Inference
        with open(filepath, "rb") as f:
            img_bytes = f.read()
        dima_res = dima_engine.predict_image_bytes(img_bytes, filename=filename)
        dima_prob = dima_res.get("deepfakeProbability", 0.0)

        # Candidate Inference
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

    # Grid Search Range
    ai_thresholds = [round(t, 2) for t in np.arange(0.50, 0.96, 0.05)]
    nat_thresholds = [round(t, 2) for t in np.arange(0.05, 0.51, 0.05)]

    total_specimens = len(specimen_data)
    grid_results = []

    print("\nExecuting Grid Search over Three-Way Threshold Configurations...")

    for t_ai in ai_thresholds:
        for t_nat in nat_thresholds:
            if t_nat >= t_ai:
                continue

            ai_tp, ai_fp, ai_fn = 0, 0, 0
            nat_tp, nat_fp = 0, 0
            uncertain_cnt = 0
            decided_cnt = 0

            for s in specimen_data:
                prob = s["dima_prob"]
                gt = s["ground_truth"]

                if prob >= t_ai:
                    pred = "AI GENERATED"
                elif prob <= t_nat:
                    pred = "NATURAL"
                else:
                    pred = "UNCERTAIN"

                if pred == "AI GENERATED":
                    decided_cnt += 1
                    if gt == "AI":
                        ai_tp += 1
                    else:
                        ai_fp += 1
                elif pred == "NATURAL":
                    decided_cnt += 1
                    if gt == "NATURAL":
                        nat_tp += 1
                    else:
                        nat_fp += 1
                        ai_fn += 1
                else: # UNCERTAIN
                    uncertain_cnt += 1
                    if gt == "AI":
                        ai_fn += 1

            coverage = (decided_cnt / total_specimens) * 100.0
            decided_acc = (ai_tp + nat_tp) / decided_cnt * 100.0 if decided_cnt > 0 else 0.0

            # Overall accuracy if UNCERTAIN is treated as NOT-AI (i.e. correct if Natural, incorrect if AI)
            # Correct cases: AI classified as AI (ai_tp) + Natural classified as Natural (nat_tp) + Natural classified as Uncertain
            nat_uncertain_cnt = sum(1 for s in specimen_data if s["ground_truth"] == "NATURAL" and (s["dima_prob"] > t_nat and s["dima_prob"] < t_ai))
            overall_acc = (ai_tp + nat_tp + nat_uncertain_cnt) / total_specimens * 100.0

            prec = (ai_tp / (ai_tp + ai_fp) * 100.0) if (ai_tp + ai_fp) > 0 else 0.0
            rec = (ai_tp / (ai_tp + ai_fn) * 100.0) if (ai_tp + ai_fn) > 0 else 0.0
            f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

            grid_results.append({
                "ai_threshold": f"{t_ai:.2f}",
                "natural_threshold": f"{t_nat:.2f}",
                "coverage": f"{coverage:.2f}",
                "decided_accuracy": f"{decided_acc:.2f}",
                "overall_accuracy": f"{overall_acc:.2f}",
                "precision": f"{prec:.2f}",
                "recall": f"{rec:.2f}",
                "f1": f"{f1:.2f}",
                "AI_TP": ai_tp, "AI_FP": ai_fp, "AI_FN": ai_fn,
                "NAT_TP": nat_tp, "NAT_FP": nat_fp,
                "UNCERTAIN_count": uncertain_cnt,
                "raw_prec": prec, "raw_rec": rec, "raw_f1": f1, "raw_cov": coverage, "raw_dec_acc": decided_acc, "raw_fp": ai_fp
            })

    # Save CSV Report
    fieldnames = [
        "ai_threshold", "natural_threshold", "coverage",
        "decided_accuracy", "overall_accuracy", "precision",
        "recall", "f1", "AI_TP", "AI_FP", "AI_FN",
        "NAT_TP", "NAT_FP", "UNCERTAIN_count"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for r in grid_results:
            row_dict = {k: r[k] for k in fieldnames}
            writer.writerow(row_dict)

    print(f"[OK] Saved three-way threshold search CSV to: {csv_path}")

    # -------------------------------------------------------------
    # SELECTION & EVALUATION OF RECOMMENDED CONFIGURATIONS
    # -------------------------------------------------------------
    # 1. BEST HIGH-CONFIDENCE: Zero AI False Positives (AI_FP == 0), highest Decided Accuracy
    high_conf_configs = [r for r in grid_results if r["AI_FP"] == 0]
    high_conf_configs.sort(key=lambda x: (x["raw_dec_acc"], x["raw_cov"], x["raw_f1"]), reverse=True)
    best_high_conf = high_conf_configs[0]

    # 2. BEST BALANCED: Low FP (AI_FP <= 1), highest F1 and Coverage
    balanced_configs = [r for r in grid_results if r["AI_FP"] <= 1]
    balanced_configs.sort(key=lambda x: (x["raw_f1"], x["raw_dec_acc"], x["raw_cov"]), reverse=True)
    best_balanced = balanced_configs[0]

    # 3. BEST LOW-FALSE-POSITIVE: Absolute zero FP (AI_FP == 0), highest Recall
    low_fp_configs = [r for r in grid_results if r["AI_FP"] == 0]
    low_fp_configs.sort(key=lambda x: (x["raw_rec"], x["raw_f1"], x["raw_dec_acc"]), reverse=True)
    best_low_fp = low_fp_configs[0]

    print("\n" + "=" * 90)
    print("UNCERTAINTY CALIBRATION: THREE-WAY RECOMMENDED CONFIGURATIONS")
    print("=" * 90)

    for cat_name, cfg in [
        ("BEST HIGH-CONFIDENCE (Zero AI False Positives)", best_high_conf),
        ("BEST BALANCED (Optimal F1 with Low FP)", best_balanced),
        ("BEST LOW-FALSE-POSITIVE (Zero FP with Max Recall)", best_low_fp)
    ]:
        print(f"\n[{cat_name}]")
        print(f"  AI Threshold       : {cfg['ai_threshold']} (prob >= {cfg['ai_threshold']} -> AI GENERATED)")
        print(f"  Natural Threshold  : {cfg['natural_threshold']} (prob <= {cfg['natural_threshold']} -> NATURAL)")
        print(f"  Uncertain Range    : ({cfg['natural_threshold']} < prob < {cfg['ai_threshold']} -> UNCERTAIN)")
        print(f"  Coverage           : {cfg['coverage']}%")
        print(f"  Decided Accuracy   : {cfg['decided_accuracy']}%")
        print(f"  Overall Accuracy   : {cfg['overall_accuracy']}%")
        print(f"  Precision          : {cfg['precision']}%")
        print(f"  Recall             : {cfg['recall']}%")
        print(f"  F1 Score           : {cfg['f1']}%")
        print(f"  AI False Positives : {cfg['AI_FP']}")
        print(f"  AI False Negatives : {cfg['AI_FN']}")
        print(f"  Uncertain Count    : {cfg['UNCERTAIN_count']}")

    print("=" * 90)

    # -------------------------------------------------------------
    # SECONDARY CANDIDATE SIGNAL EXPERIMENT FOR UNCERTAIN SPECIMENS
    # -------------------------------------------------------------
    print("\n" + "=" * 95)
    print("SECONDARY CANDIDATE SIGNAL ANALYSIS (EVALUATING UNCERTAIN SPECIMENS)")
    print("=" * 95)
    print("Recommended Baseline: AI Threshold = 0.85, Natural Threshold = 0.40")
    print("-" * 95)

    rec_t_ai = 0.85
    rec_t_nat = 0.40

    header = f"{'Filename':<30} | {'Ground Truth':<12} | {'dima %':<10} | {'cand %':<10} | {'Three-Way State':<18} | {'Candidate Support':<20}"
    print(header)
    print("-" * 95)

    for s in specimen_data:
        fname = s["filename"]
        gt = s["ground_truth"]
        d = s["dima_prob"]
        c = s["cand_prob"]

        if d >= rec_t_ai:
            state = "AI GENERATED"
        elif d <= rec_t_nat:
            state = "NATURAL"
        else:
            state = "UNCERTAIN"

        if state == "UNCERTAIN":
            cand_support = f"Cand AI ({c*100:5.2f}%)" if c >= 0.80 else f"Cand Real ({(1-c)*100:5.2f}%)"
        else:
            cand_support = "Decided by dima"

        print(f"{fname:<30} | {gt:<12} | {d*100:8.2f}% | {c*100:8.2f}% | {state:<18} | {cand_support:<20}")

    print("=" * 95)

    # -------------------------------------------------------------
    # SPECIAL SPECIMEN BREAKDOWN
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print("TARGETED SPECIAL SPECIMEN UNCERTAINTY BREAKDOWN")
    print("=" * 80)

    special_files = [
        ("real_camera_person.jpg", "NATURAL"),
        ("real_camera_nature.jpg", "NATURAL"),
        ("real_camera_teapot.jpg", "NATURAL"),
        ("real_camera_tiger.jpg", "NATURAL"),
        ("ai_boy_portrait2.png", "AI"),
        ("ai_sdxl_landscape.jpg", "AI"),
        ("ai_sdxl_img2img.jpg", "AI"),
        ("ai_gan_bedroom.jpg", "AI")
    ]

    for fname, gt in special_files:
        s = next(item for item in specimen_data if item["filename"] == fname)
        d = s["dima_prob"]
        c = s["cand_prob"]

        if d >= rec_t_ai:
            state = "AI GENERATED"
        elif d <= rec_t_nat:
            state = "NATURAL"
        else:
            state = "UNCERTAIN"

        print(f"  - {fname:<25} [GT: {gt:<7}] | dima: {d*100:6.2f}% | candidate: {c*100:6.2f}% | 3-Way State: {state}")

    print("=" * 80)

if __name__ == "__main__":
    run_three_way_calibration()
