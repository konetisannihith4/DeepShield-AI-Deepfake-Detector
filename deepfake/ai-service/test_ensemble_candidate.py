import os
import csv
import torch
import cv2
import numpy as np
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

from image_ai_detector import ImageAIDetectorEngine

KNOWN_GROUND_TRUTH = {
    # 1. AI-Generated Images
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

    # 2. Real Genuine Camera Photographs
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

    # 3. Edited / Compressed / Resized Real Photographs
    "real_edited_color_adjust.jpg": "NATURAL",
    "real_edited_gaussian_blur.jpg": "NATURAL",
    "real_edited_jpeg_q30.jpg": "NATURAL",
    "real_edited_jpeg_q50.jpg": "NATURAL",
    "real_edited_resample_0.5x.jpg": "NATURAL"
}

def run_ensemble_benchmark():
    model_id = "ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    print("=" * 80)
    print("WEIGHT CHECK: CANDIDATE MODEL FOR ENSEMBLE EVALUATION")
    print("=" * 80)
    print(f"MODEL              : {model_id}")
    print(f"REPOSITORY         : https://huggingface.co/{model_id}")
    print(f"ARCHITECTURE       : SwinForImageClassification (Swin Transformer)")
    print(f"TRAINED CHECKPOINT : model.safetensors")
    print(f"CHECKPOINT SIZE    : ~343 MB")
    print(f"LABEL MAPPING      : {{0: 'ai_gen', 1: 'human'}}")
    print(f"INPUT SIZE         : 224x224 RGB image (AutoImageProcessor)")
    print(f"LICENSE            : Apache 2.0")
    print(f"INTENDED TASK      : AI-generated vs Real Image Detection (Midjourney v6, SDXL)")
    print("-" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load Candidate Model & Processor
    processor = AutoImageProcessor.from_pretrained(model_id)
    cand_model = AutoModelForImageClassification.from_pretrained(model_id)
    cand_model.to(device)
    cand_model.eval()

    # Load Production dima806 Engine
    print("\nLoading Production dima806 Engine...")
    dima_engine = ImageAIDetectorEngine()

    image_files = sorted(list(KNOWN_GROUND_TRUTH.keys()))

    candidate_results = []
    dima_results = []

    print("\n" + "=" * 80)
    print("RUNNING STANDALONE CANDIDATE MODEL INFERENCE ACROSS ALL 26 SPECIMENS")
    print("=" * 80)

    for filename in image_files:
        filepath = os.path.join(uploads_dir, filename)
        if not os.path.exists(filepath):
            print(f"Warning: File not found: {filepath}")
            continue

        ground_truth = KNOWN_GROUND_TRUTH[filename]

        # 1. Candidate Model Inference
        pil_img = Image.open(filepath).convert("RGB")
        inputs = processor(images=pil_img, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = cand_model(**inputs)
            logits = outputs.logits[0]
            probs = torch.nn.functional.softmax(logits, dim=-1)

        ai_prob = float(probs[0].item())   # index 0 = 'ai_gen'
        real_prob = float(probs[1].item()) # index 1 = 'human'
        conf = max(ai_prob, real_prob)
        cand_pred = "Likely AI Generated" if ai_prob >= 0.50 else "Likely Natural"

        candidate_results.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "ai_prob": ai_prob,
            "real_prob": real_prob,
            "confidence": conf,
            "prediction": cand_pred
        })

        # 2. Production dima806 Engine Inference
        with open(filepath, "rb") as f:
            img_bytes = f.read()
        dima_res = dima_engine.predict_image_bytes(img_bytes, filename=filename)
        dima_ai_prob = dima_res.get("deepfakeProbability", 0.0)
        dima_pred = dima_res.get("prediction", "")

        dima_results.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "ai_prob": dima_ai_prob,
            "prediction": dima_pred
        })

        print(f"\n==================================================")
        print(f"filename       : {filename} (Ground Truth: {ground_truth})")
        print(f"CANDIDATE AI % : {ai_prob * 100:.2f}% | Real %: {real_prob * 100:.2f}%")
        print(f"CANDIDATE PRED : {cand_pred} (Confidence: {conf * 100:.2f}%)")
        print(f"dima806 AI %   : {dima_ai_prob * 100:.2f}% | dima806 Pred: {dima_pred}")
        print(f"==================================================")

    # -------------------------------------------------------------
    # STANDALONE METRICS FOR CANDIDATE MODEL
    # -------------------------------------------------------------
    print(f"\n--- STANDALONE PERFORMANCE METRICS FOR CANDIDATE ({model_id}) ---")
    c_tp, c_tn, c_fp, c_fn = 0, 0, 0, 0
    for res in candidate_results:
        is_gt_ai = res["ground_truth"] == "AI"
        is_pred_ai = res["prediction"] == "Likely AI Generated"

        if is_gt_ai and is_pred_ai:
            c_tp += 1
        elif not is_gt_ai and not is_pred_ai:
            c_tn += 1
        elif not is_gt_ai and is_pred_ai:
            c_fp += 1
        elif is_gt_ai and not is_pred_ai:
            c_fn += 1

    total_specimens = len(candidate_results)
    c_acc = (c_tp + c_tn) / total_specimens if total_specimens > 0 else 0.0
    c_prec = c_tp / (c_tp + c_fp) if (c_tp + c_fp) > 0 else 0.0
    c_rec = c_tp / (c_tp + c_fn) if (c_tp + c_fn) > 0 else 0.0
    c_f1 = (2 * c_prec * c_rec) / (c_prec + c_rec) if (c_prec + c_rec) > 0 else 0.0

    print(f"Accuracy                 : {c_acc * 100:.2f}% ({c_tp + c_tn}/{total_specimens})")
    print(f"Precision                : {c_prec * 100:.2f}%")
    print(f"Recall                   : {c_rec * 100:.2f}%")
    print(f"F1 Score                 : {c_f1 * 100:.2f}%")
    print(f"True Positives (TP)      : {c_tp}")
    print(f"True Negatives (TN)      : {c_tn}")
    print(f"False Positives (FP)     : {c_fp}")
    print(f"False Negatives (FN)     : {c_fn}")
    print("=" * 80)

    # -------------------------------------------------------------
    # CRITICAL COMPARISON ANALYSIS
    # -------------------------------------------------------------
    print("\n" + "=" * 90)
    print("ANALYSIS: TARGETED EVALUATION ON dima806 WEAKNESSES & RISKS")
    print("=" * 90)

    dima_fn_files = ["ai_boy_portrait2.png", "ai_sdxl_landscape.jpg", "ai_sdxl_img2img.jpg", "ai_gan_bedroom.jpg"]
    print("\n1. Evaluation on the 4 AI Images Missed by dima806:")
    for fname in dima_fn_files:
        c_res = next(r for r in candidate_results if r["filename"] == fname)
        d_res = next(r for r in dima_results if r["filename"] == fname)
        status = "RECOVERED (Detected)" if c_res["prediction"] == "Likely AI Generated" else "MISSED (FN)"
        print(f"  - {fname:<25} | dima806 AI: {d_res['ai_prob']*100:6.2f}% | Candidate AI: {c_res['ai_prob']*100:6.2f}% | {status}")

    fp_risk_files = [
        "real_camera_person.jpg", "real_edited_jpeg_q30.jpg", "real_edited_jpeg_q50.jpg",
        "real_camera_nature.jpg", "real_camera_teapot.jpg", "real_camera_tiger.jpg"
    ]
    print("\n2. Evaluation on High-Risk Natural & Edited Specimen False Positives:")
    for fname in fp_risk_files:
        c_res = next(r for r in candidate_results if r["filename"] == fname)
        d_res = next(r for r in dima_results if r["filename"] == fname)
        c_fp_flag = "FALSE POSITIVE" if c_res["prediction"] == "Likely AI Generated" else "NATURAL (Safe)"
        print(f"  - {fname:<28} | dima806 AI: {d_res['ai_prob']*100:6.2f}% | Candidate AI: {c_res['ai_prob']*100:6.2f}% | {c_fp_flag}")

    # -------------------------------------------------------------
    # OFFLINE ENSEMBLE SIMULATIONS
    # -------------------------------------------------------------
    print("\n" + "=" * 95)
    print("OFFLINE ENSEMBLE SIMULATIONS (TESTING CONSERVATIVE COMBINATION RULES)")
    print("=" * 95)

    def evaluate_rule(rule_name: str, rule_fn):
        tp, tn, fp, fn = 0, 0, 0, 0
        for i in range(total_specimens):
            d_prob = dima_results[i]["ai_prob"]
            c_prob = candidate_results[i]["ai_prob"]
            gt = candidate_results[i]["ground_truth"]

            is_ai_pred = rule_fn(d_prob, c_prob)
            is_gt_ai = (gt == "AI")

            if is_gt_ai and is_ai_pred:
                tp += 1
            elif not is_gt_ai and not is_ai_pred:
                tn += 1
            elif not is_gt_ai and is_ai_pred:
                fp += 1
            elif is_gt_ai and not is_ai_pred:
                fn += 1

        acc = (tp + tn) / total_specimens * 100.0
        prec = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
        rec = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        return {
            "name": rule_name,
            "accuracy": acc, "precision": prec, "recall": rec, "f1": f1,
            "tp": tp, "tn": tn, "fp": fp, "fn": fn
        }

    rules = [
        ("Production dima806 Only", lambda d, c: d >= 0.50),
        ("Candidate Model Only", lambda d, c: c >= 0.50),
        ("RULE A: AI if either >= 0.90", lambda d, c: d >= 0.90 or c >= 0.90),
        ("RULE B: AI if both >= 0.50", lambda d, c: d >= 0.50 and c >= 0.50),
        ("RULE C: dima806 >= 0.90 OR (cand >= 0.90 AND dima806 >= 0.20)", lambda d, c: d >= 0.90 or (c >= 0.90 and d >= 0.20)),
        ("RULE D: cand >= 0.80 AND dima806 >= 0.20", lambda d, c: c >= 0.80 and d >= 0.20),
        ("RULE E: Soft Average >= 0.50", lambda d, c: ((d + c) / 2.0) >= 0.50)
    ]

    rule_results = [evaluate_rule(r_name, r_fn) for r_name, r_fn in rules]

    header = f"{'Rule Name':<42} | {'Acc %':<7} | {'Prec %':<7} | {'Rec %':<7} | {'F1 %':<7} | {'FP':<3} | {'FN':<3}"
    print(header)
    print("-" * 95)
    for res in rule_results:
        print(f"{res['name']:<42} | {res['accuracy']:6.2f}% | {res['precision']:6.2f}% | {res['recall']:6.2f}% | {res['f1']:6.2f}% | {res['fp']:<3} | {res['fn']:<3}")

    print("=" * 95)

if __name__ == "__main__":
    run_ensemble_benchmark()
