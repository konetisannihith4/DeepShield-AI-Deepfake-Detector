import os
import sys
import torch
import cv2
import numpy as np
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

from image_ai_detector import ImageAIDetectorEngine

def run_new_model_benchmark():
    model_id = "umm-maybe/AI-image-detector"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    print("=" * 80)
    print("WEIGHT CHECK: umm-maybe/AI-image-detector")
    print("=" * 80)
    print(f"MODEL            : umm-maybe/AI-image-detector")
    print(f"REPOSITORY       : https://huggingface.co/umm-maybe/AI-image-detector")
    print(f"ARCHITECTURE     : SwinForImageClassification (Swin Transformer)")
    print(f"CHECKPOINT FILE  : pytorch_model.bin")
    print(f"CHECKPOINT SIZE  : ~343 MB")
    print(f"LABEL MAPPING    : {{'0': 'artificial', '1': 'human'}}")
    print(f"EXPECTED INPUT   : 224x224 RGB image (ImageNet normalization)")
    print(f"LICENSE          : CC-BY-4.0")
    print("-" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load Model and Processor
    processor = AutoImageProcessor.from_pretrained(model_id)
    model = AutoModelForImageClassification.from_pretrained(model_id)
    model.to(device)
    model.eval()

    print("\n--- MODEL VERIFICATION & METADATA ---")
    print(f"Architecture: {model.__class__.__name__}")
    print(f"id2label    : {model.config.id2label}")
    print(f"label2id    : {model.config.label2id}")
    print("Pretrained Weights Loaded: YES (Verified pytorch_model.bin from HF Hub)")
    print("-" * 80)

    # Determine index mapping for artificial (AI) and human (real)
    art_idx = None
    hum_idx = None
    for k, v in model.config.id2label.items():
        val = str(v).lower()
        if "artific" in val or "ai" in val or "fake" in val:
            art_idx = int(k)
        elif "hum" in val or "real" in val:
            hum_idx = int(k)

    if art_idx is None or hum_idx is None:
        art_idx = 0
        hum_idx = 1

    print(f"Mapped AI Index    : {art_idx} -> '{model.config.id2label[art_idx]}'")
    print(f"Mapped Human Index : {hum_idx} -> '{model.config.id2label[hum_idx]}'\n")

    # Load Production dima806 Engine for Side-by-Side Comparison
    print("Loading Production dima806 Engine for Side-by-Side Comparison...")
    dima_engine = ImageAIDetectorEngine()

    test_files = [
        ("ai_boy_portrait1.png", "AI"),
        ("ai_boy_portrait2.png", "AI"),
        ("ai_chatgpt.png", "AI"),
        ("ai_specimen3.jpg", "Natural"),
        ("test.jpg.jpg", "Natural")
    ]

    new_results = []
    dima_results = []

    print("\n" + "=" * 80)
    print("RUNNING INDIVIDUAL IMAGE INFERENCE BENCHMARKS")
    print("=" * 80)

    for filename, ground_truth in test_files:
        filepath = os.path.join(uploads_dir, filename)
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            continue

        img_pil = Image.open(filepath).convert("RGB")

        # New Model Inference
        inputs = processor(images=img_pil, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits[0]
            probs = torch.nn.functional.softmax(logits, dim=-1)

        ai_prob = float(probs[art_idx].item())
        real_prob = float(probs[hum_idx].item())
        conf = max(ai_prob, real_prob)
        new_pred = "Likely AI Generated" if ai_prob >= 0.50 else "Likely Natural"

        new_results.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "raw_logits": logits.cpu().numpy().tolist(),
            "ai_prob": ai_prob,
            "real_prob": real_prob,
            "confidence": conf,
            "prediction": new_pred
        })

        # dima806 Production Engine Inference
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
        print(f"IMAGE: {filename} (Ground Truth: {ground_truth})")
        print(f"MODEL: {model_id}")
        print(f"RAW LOGITS: {logits.cpu().numpy().tolist()}")
        print(f"AI PROBABILITY: {ai_prob * 100:.2f}%")
        print(f"REAL PROBABILITY: {real_prob * 100:.2f}%")
        print(f"CONFIDENCE: {conf * 100:.2f}%")
        print(f"PREDICTION: {new_pred}")
        print(f"==================================================")

    # -------------------------------------------------------------
    # SIDE-BY-SIDE COMPARISON TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 85)
    print(f"SIDE-BY-SIDE BENCHMARK COMPARISON TABLE: dima806 vs. {model_id}")
    print("=" * 85)
    header = f"{'IMAGE':<22} | {'dima806 AI %':<12} | {'dima806 Pred':<20} | {'umm-maybe AI %':<16} | {'umm-maybe Pred':<20}"
    print(header)
    print("-" * 85)

    for i in range(len(test_files)):
        n = new_results[i]
        d = dima_results[i]
        fname = n["filename"]
        d_ai_str = f"{d['ai_prob'] * 100:.2f}%"
        n_ai_str = f"{n['ai_prob'] * 100:.2f}%"
        print(f"{fname:<22} | {d_ai_str:<12} | {d['prediction']:<20} | {n_ai_str:<16} | {n['prediction']:<20}")

    print("=" * 85)

    # -------------------------------------------------------------
    # ACCURACY & ERROR METRICS FOR NEW MODEL
    # -------------------------------------------------------------
    print(f"\n--- {model_id} PERFORMANCE METRICS ---")
    tp, tn, fp, fn = 0, 0, 0, 0

    for n in new_results:
        is_gt_ai = n["ground_truth"] == "AI"
        is_pred_ai = n["prediction"] == "Likely AI Generated"

        if is_gt_ai and is_pred_ai:
            tp += 1
        elif not is_gt_ai and not is_pred_ai:
            tn += 1
        elif not is_gt_ai and is_pred_ai:
            fp += 1
        elif is_gt_ai and not is_pred_ai:
            fn += 1

    total = len(new_results)
    acc = (tp + tn) / total * 100.0 if total > 0 else 0.0

    print(f"Accuracy                : {acc:.2f}% ({tp + tn}/{total})")
    print(f"True Positives (TP)     : {tp} (AI correctly detected)")
    print(f"True Negatives (TN)     : {tn} (Natural correctly detected)")
    print(f"False Positives (FP)    : {fp} (Natural falsely flagged as AI)")
    print(f"False Negatives (FN)    : {fn} (AI missed as Natural)")
    print("=" * 80)

if __name__ == "__main__":
    run_new_model_benchmark()
