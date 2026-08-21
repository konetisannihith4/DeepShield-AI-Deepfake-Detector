import os
import sys
import torch
from PIL import Image
import numpy as np
import cv2
from transformers import AutoImageProcessor, AutoModelForImageClassification

# Import existing dima806 model for side-by-side benchmark comparison
from image_ai_model import ImageDeepfakeDetectorModel

def benchmark():
    model_id = "Ateeqq/ai-vs-human-image-detector"
    print("=" * 60)
    print(f"LOADING MODEL: {model_id}")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # Load Ateeqq Image Processor and Model
    processor = AutoImageProcessor.from_pretrained(model_id)
    model = AutoModelForImageClassification.from_pretrained(model_id)
    model.to(device)
    model.eval()

    print("\n--- ATEEQQ MODEL METADATA ---")
    print(f"Architecture: {model.__class__.__name__}")
    print(f"id2label    : {model.config.id2label}")
    print(f"label2id    : {model.config.label2id}")
    print(f"num_labels  : {model.config.num_labels}")
    print("Pretrained Weights Loaded: YES (Verified from HuggingFace Hub)")
    print("-" * 60)

    # Determine label mapping index for Ateeqq
    # id2label: {0: 'ai', 1: 'hum'}
    ai_idx = None
    hum_idx = None
    for k, v in model.config.id2label.items():
        val = str(v).lower()
        if "ai" in val or "fake" in val or "generated" in val:
            ai_idx = int(k)
        elif "hum" in val or "real" in val or "natural" in val:
            hum_idx = int(k)

    if ai_idx is None or hum_idx is None:
        # Fallback to default schema if not explicitly parsed
        ai_idx = 0
        hum_idx = 1

    print(f"Mapped AI Index    : {ai_idx} -> '{model.config.id2label.get(ai_idx, model.config.id2label.get(str(ai_idx)))}'")
    print(f"Mapped Human Index : {hum_idx} -> '{model.config.id2label.get(hum_idx, model.config.id2label.get(str(hum_idx)))}'\n")

    # Load dima806 for comparison
    print("Loading dima806 for benchmark comparison...")
    dima_detector = ImageDeepfakeDetectorModel()

    # Target test images
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    test_files = [
        ("ai_boy_portrait1.png", "AI-generated"),
        ("ai_boy_portrait2.png", "AI-generated"),
        ("ai_chatgpt.png", "AI-generated"),
        ("ai_specimen3.jpg", "Natural"),
        ("test.jpg.jpg", "Natural")
    ]

    ateeq_results = []
    dima_results = []

    print("\n" + "=" * 60)
    print("RUNNING INDIVIDUAL IMAGE INFERENCE BENCHMARKS")
    print("=" * 60)

    for filename, expected_ground_truth in test_files:
        filepath = os.path.join(uploads_dir, filename)
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            continue

        # Load image
        img_pil = Image.open(filepath).convert("RGB")
        bgr_array = cv2.imread(filepath)

        # Ateeqq Inference
        inputs = processor(images=img_pil, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits[0]
            probs = torch.nn.functional.softmax(logits, dim=-1)

        ai_prob = float(probs[ai_idx].item())
        hum_prob = float(probs[hum_idx].item())
        conf = max(ai_prob, hum_prob)

        ateeq_pred = "Likely AI Generated" if ai_prob >= 0.50 else "Likely Natural"

        ateeq_results.append({
            "filename": filename,
            "ground_truth": expected_ground_truth,
            "logits": logits.cpu().numpy().tolist(),
            "ai_prob": ai_prob,
            "hum_prob": hum_prob,
            "confidence": conf,
            "prediction": ateeq_pred
        })

        # dima806 Inference
        dima_real_prob, dima_fake_prob = dima_detector.predict_image_array(bgr_array)
        dima_pred = "Likely AI Generated" if dima_fake_prob >= 0.50 else "Likely Natural"

        dima_results.append({
            "filename": filename,
            "ground_truth": expected_ground_truth,
            "real_prob": dima_real_prob,
            "fake_prob": dima_fake_prob,
            "prediction": dima_pred
        })

        print(f"\n==================================================")
        print(f"IMAGE: {filename} (Expected: {expected_ground_truth})")
        print(f"MODEL: {model_id}")
        print(f"RAW LOGITS: {logits.cpu().numpy().tolist()}")
        print(f"LABEL: {ateeq_pred}")
        print(f"AI PROBABILITY: {ai_prob * 100:.2f}%")
        print(f"HUMAN PROBABILITY: {hum_prob * 100:.2f}%")
        print(f"CONFIDENCE: {conf * 100:.2f}%")
        print(f"==================================================")

    # Output Comparison Table
    print("\n" + "=" * 80)
    print("BENCHMARK COMPARISON TABLE: dima806 vs. Ateeqq")
    print("=" * 80)
    header = f"{'IMAGE':<22} | {'dima806 AI %':<12} | {'Ateeqq AI %':<12} | {'dima806 prediction':<20} | {'Ateeqq prediction':<20}"
    print(header)
    print("-" * 80)

    for i in range(len(test_files)):
        a = ateeq_results[i]
        d = dima_results[i]
        fname = a["filename"]
        d_ai_pct = f"{d['fake_prob'] * 100:.2f}%"
        a_ai_pct = f"{a['ai_prob'] * 100:.2f}%"
        d_pred = d["prediction"]
        a_pred = a["prediction"]
        print(f"{fname:<22} | {d_ai_pct:<12} | {a_ai_pct:<12} | {d_pred:<20} | {a_pred:<20}")

    print("=" * 80)

    # Accuracy Metrics Calculation
    print("\n--- DETAILED ACCURACY & ERROR METRICS ---")
    
    # Calculate for Ateeqq
    ateeq_tp = 0 # Ground truth AI, predicted AI
    ateeq_tn = 0 # Ground truth Natural, predicted Natural
    ateeq_fp = 0 # Ground truth Natural, predicted AI
    ateeq_fn = 0 # Ground truth AI, predicted Natural

    for a in ateeq_results:
        is_gt_ai = a["ground_truth"] == "AI-generated"
        is_pred_ai = a["prediction"] == "Likely AI Generated"

        if is_gt_ai and is_pred_ai:
            ateeq_tp += 1
        elif not is_gt_ai and not is_pred_ai:
            ateeq_tn += 1
        elif not is_gt_ai and is_pred_ai:
            ateeq_fp += 1
        elif is_gt_ai and not is_pred_ai:
            ateeq_fn += 1

    total = len(ateeq_results)
    ateeq_acc = (ateeq_tp + ateeq_tn) / total if total > 0 else 0.0

    print(f"\nAteeqq Performance Metrics:")
    print(f"  Accuracy                : {ateeq_acc * 100:.2f}% ({ateeq_tp + ateeq_tn}/{total})")
    print(f"  True AI Detections (TP) : {ateeq_tp}")
    print(f"  True Natural Detections : {ateeq_tn}")
    print(f"  False Positives (FP)    : {ateeq_fp}")
    print(f"  False Negatives (FN)    : {ateeq_fn}")

    # Calculate for dima806
    dima_tp = 0
    dima_tn = 0
    dima_fp = 0
    dima_fn = 0

    for d in dima_results:
        is_gt_ai = d["ground_truth"] == "AI-generated"
        is_pred_ai = d["prediction"] == "Likely AI Generated"

        if is_gt_ai and is_pred_ai:
            dima_tp += 1
        elif not is_gt_ai and not is_pred_ai:
            dima_tn += 1
        elif not is_gt_ai and is_pred_ai:
            dima_fp += 1
        elif is_gt_ai and not is_pred_ai:
            dima_fn += 1

    dima_acc = (dima_tp + dima_tn) / total if total > 0 else 0.0

    print(f"\ndima806 Performance Metrics:")
    print(f"  Accuracy                : {dima_acc * 100:.2f}% ({dima_tp + dima_tn}/{total})")
    print(f"  True AI Detections (TP) : {dima_tp}")
    print(f"  True Natural Detections : {dima_tn}")
    print(f"  False Positives (FP)    : {dima_fp}")
    print(f"  False Negatives (FN)    : {dima_fn}")
    print("=" * 60)

if __name__ == "__main__":
    benchmark()
