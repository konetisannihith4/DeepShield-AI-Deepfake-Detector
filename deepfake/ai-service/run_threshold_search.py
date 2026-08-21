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

def run_threshold_grid_search():
    model_id = "ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    csv_path = os.path.join(base_dir, "ensemble_threshold_search.csv")

    print("=" * 80)
    print("EXHAUSTIVE ENSEMBLE THRESHOLD GRID SEARCH (26 SPECIMENS)")
    print("=" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load Models & Extract Probabilities for 26 Specimens
    processor = AutoImageProcessor.from_pretrained(model_id)
    cand_model = AutoModelForImageClassification.from_pretrained(model_id)
    cand_model.to(device)
    cand_model.eval()

    print("Loading Production dima806 Engine...")
    dima_engine = ImageAIDetectorEngine()

    filenames = sorted(list(KNOWN_GROUND_TRUTH.keys()))
    specimen_data = []

    print("\nExtracting Model Probabilities for All 26 Specimens...")
    for filename in filenames:
        filepath = os.path.join(uploads_dir, filename)
        gt = KNOWN_GROUND_TRUTH[filename]

        # Candidate Inference
        pil_img = Image.open(filepath).convert("RGB")
        inputs = processor(images=pil_img, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = cand_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits[0], dim=-1)
        cand_prob = float(probs[0].item()) # index 0 = 'ai_gen'

        # dima806 Inference
        with open(filepath, "rb") as f:
            img_bytes = f.read()
        dima_res = dima_engine.predict_image_bytes(img_bytes, filename=filename)
        dima_prob = dima_res.get("deepfakeProbability", 0.0)

        specimen_data.append({
            "filename": filename,
            "ground_truth": gt,
            "dima_prob": dima_prob,
            "cand_prob": cand_prob
        })

    print(f"[OK] Collected probabilities for {len(specimen_data)} specimens.")

    # Grid Search Range
    thresholds = [round(t, 2) for t in np.arange(0.10, 0.96, 0.05)]
    forms = ["OR", "AND", "DIMA-FIRST", "CANDIDATE-FIRST", "HIGH-CONFIDENCE CANDIDATE"]

    grid_results = []
    total_specimens = len(specimen_data)

    print("\nRunning Exhaustive Grid Search over 1,620 Combinations...")

    for form in forms:
        for t_dima in thresholds:
            for t_cand in thresholds:
                tp, tn, fp, fn = 0, 0, 0, 0

                for s in specimen_data:
                    d = s["dima_prob"]
                    c = s["cand_prob"]
                    is_gt_ai = (s["ground_truth"] == "AI")

                    if form == "OR":
                        is_ai = (d >= t_dima) or (c >= t_cand)
                    elif form == "AND":
                        is_ai = (d >= t_dima) and (c >= t_cand)
                    elif form == "DIMA-FIRST":
                        is_ai = (d >= t_dima) or (c >= t_cand and d >= 0.15)
                    elif form == "CANDIDATE-FIRST":
                        is_ai = (c >= t_cand) or (d >= t_dima and c >= 0.15)
                    elif form == "HIGH-CONFIDENCE CANDIDATE":
                        is_ai = (c >= t_cand and d >= 0.10) or (d >= 0.90)

                    if is_gt_ai and is_ai:
                        tp += 1
                    elif not is_gt_ai and not is_ai:
                        tn += 1
                    elif not is_gt_ai and is_ai:
                        fp += 1
                    elif is_gt_ai and not is_ai:
                        fn += 1

                acc = (tp + tn) / total_specimens * 100.0
                prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
                rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
                f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

                grid_results.append({
                    "rule": form,
                    "dima_threshold": f"{t_dima:.2f}",
                    "candidate_threshold": f"{t_cand:.2f}",
                    "accuracy": f"{acc:.2f}",
                    "precision": f"{prec:.2f}",
                    "recall": f"{rec:.2f}",
                    "f1": f"{f1:.2f}",
                    "TP": tp, "TN": tn, "FP": fp, "FN": fn,
                    "raw_acc": acc, "raw_prec": prec, "raw_rec": rec, "raw_f1": f1
                })

    # Save CSV Report
    fieldnames = [
        "rule", "dima_threshold", "candidate_threshold",
        "accuracy", "precision", "recall", "f1",
        "TP", "TN", "FP", "FN"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for r in grid_results:
            row_dict = {k: r[k] for k in fieldnames}
            writer.writerow(row_dict)

    print(f"[OK] Saved full threshold search CSV to: {csv_path}")

    # -------------------------------------------------------------
    # RANKING & TOP 20 CONFIGURATIONS (FP <= 2)
    # -------------------------------------------------------------
    valid_configs = [r for r in grid_results if r["FP"] <= 2]
    sorted_valid = sorted(
        valid_configs, 
        key=lambda x: (x["raw_f1"], x["raw_rec"], x["raw_prec"]), 
        reverse=True
    )

    print("\n" + "=" * 95)
    print("TOP 20 ENSEMBLE CONFIGURATIONS SATISFYING (FP <= 2) SORTED BY F1 DESCENDING")
    print("=" * 95)
    header = f"{'Rank':<4} | {'Rule':<26} | {'dima_th':<7} | {'cand_th':<7} | {'Acc %':<7} | {'Prec %':<7} | {'Rec %':<7} | {'F1 %':<7} | {'FP':<3} | {'FN':<3}"
    print(header)
    print("-" * 95)

    for idx, r in enumerate(sorted_valid[:20]):
        print(f"#{idx+1:<3} | {r['rule']:<26} | {r['dima_threshold']:<7} | {r['candidate_threshold']:<7} | {r['accuracy']:<7} | {r['precision']:<7} | {r['recall']:<7} | {r['f1']:<7} | {r['FP']:<3} | {r['FN']:<3}")

    print("=" * 95)

    # -------------------------------------------------------------
    # SELECTION OF SPECIFIC RECOMMENDED CONFIGURATIONS
    # -------------------------------------------------------------
    best_balanced = sorted_valid[0] # Highest F1 with FP <= 2

    # Best High-Recall (highest recall with FP <= 2)
    best_high_recall = sorted(
        valid_configs,
        key=lambda x: (x["raw_rec"], x["raw_f1"], x["raw_prec"]),
        reverse=True
    )[0]

    # Best Low-FP (lowest FP with highest F1/Recall)
    best_low_fp = sorted(
        valid_configs,
        key=lambda x: (-x["FP"], x["raw_f1"], x["raw_rec"]),
        reverse=True
    )[0]

    print("\n" + "=" * 80)
    print("RECOMMENDED ENSEMBLE CONFIGURATIONS")
    print("=" * 80)

    for category, cfg in [
        ("BEST BALANCED (Highest F1 with FP <= 2)", best_balanced),
        ("BEST HIGH-RECALL (Highest Recall with FP <= 2)", best_high_recall),
        ("BEST LOW-FALSE-POSITIVE (Minimal FP with Max F1)", best_low_fp)
    ]:
        print(f"\n[{category}]")
        print(f"  Rule               : {cfg['rule']}")
        print(f"  dima threshold     : {cfg['dima_threshold']}")
        print(f"  candidate threshold: {cfg['candidate_threshold']}")
        print(f"  Accuracy           : {cfg['accuracy']}%")
        print(f"  Precision          : {cfg['precision']}%")
        print(f"  Recall             : {cfg['recall']}%")
        print(f"  F1 Score           : {cfg['f1']}%")
        print(f"  False Positives    : {cfg['FP']}")
        print(f"  False Negatives    : {cfg['FN']}")

    print("=" * 80)

if __name__ == "__main__":
    run_threshold_grid_search()
