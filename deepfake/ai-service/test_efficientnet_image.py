import os
import sys
import torch
import cv2
import numpy as np
from PIL import Image

# Import existing video EfficientNet model and preprocessor
from efficientnet_model import DeepFakeClassifier
from efficientnet_preprocessing import EfficientNetPreprocessor
from image_ai_detector import ImageAIDetectorEngine

def run_efficientnet_image_benchmark():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(base_dir, "weights", "final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_40")
    uploads_dir = os.path.join(base_dir, "uploads")

    print("=" * 80)
    print("EFFICIENTNET-B7 IMAGE DETECTION BENCHMARK (EXPERIMENT ONLY)")
    print("=" * 80)

    # 1. Verify Checkpoint Existence
    if not os.path.exists(weights_path):
        # Fallback check inside pretrained_model if path structure differs
        alt_weights_path = os.path.join(base_dir, "pretrained_model", "final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_40")
        if os.path.exists(alt_weights_path):
            weights_path = alt_weights_path
        else:
            print(f"ERROR: Checkpoint file not found at: {weights_path}")
            return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device                   : {device}")
    print(f"Checkpoint File Loaded   : {weights_path}")
    print(f"Architecture             : tf_efficientnet_b7_ns (DeepFakeClassifier)")
    print(f"Input Preprocessing      : Resize (380, 380), ImageNet Normalization")
    print(f"Class Mapping            : Sigmoid(logit) -> AI/Deepfake Probability (1.0 = AI, 0.0 = Real)")
    print("-" * 80)

    # 2. Load Model Architecture & Checkpoint
    model = DeepFakeClassifier(encoder="tf_efficientnet_b7_ns", num_classes=1)
    checkpoint = torch.load(weights_path, map_location=device)
    state_dict = (
        checkpoint["state_dict"]
        if isinstance(checkpoint, dict) and "state_dict" in checkpoint
        else checkpoint
    )

    cleaned_state_dict = {}
    for k, v in state_dict.items():
        new_k = k[7:] if k.startswith("module.") else k
        cleaned_state_dict[new_k] = v

    model.load_state_dict(cleaned_state_dict, strict=True)
    model.to(device)
    model.eval()

    preprocessor = EfficientNetPreprocessor(target_size=(380, 380))

    # 3. Load Production dima806 Engine for Side-by-Side Comparison
    print("\nLoading Production dima806 Engine for Side-by-Side Comparison...")
    dima_engine = ImageAIDetectorEngine()

    test_files = [
        ("ai_boy_portrait1.png", "AI"),
        ("ai_boy_portrait2.png", "AI"),
        ("ai_chatgpt.png", "AI"),
        ("ai_specimen3.jpg", "Natural"),
        ("test.jpg.jpg", "Natural")
    ]

    eff_results = []
    dima_results = []

    print("\n" + "=" * 80)
    print("RUNNING INDIVIDUAL IMAGE INFERENCE BENCHMARKS")
    print("=" * 80)

    for filename, ground_truth in test_files:
        filepath = os.path.join(uploads_dir, filename)
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            continue

        bgr_img = cv2.imread(filepath)
        H, W = bgr_img.shape[:2]

        # EfficientNet-B7 Inference
        # 1. Full Image Canvas Tensor
        full_tensor = preprocessor.preprocess_crop(bgr_img).unsqueeze(0).to(device)
        with torch.no_grad():
            logit_tensor = model(full_tensor)
            raw_logit = float(logit_tensor.squeeze().item())
            ai_prob = float(torch.sigmoid(logit_tensor.squeeze()).item())

        real_prob = 1.0 - ai_prob
        conf = max(ai_prob, real_prob)
        eff_pred = "Likely AI Generated" if ai_prob >= 0.50 else "Likely Natural"

        eff_results.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "dim": f"{W}x{H}",
            "input_dim": "380x380",
            "raw_logit": raw_logit,
            "ai_prob": ai_prob,
            "real_prob": real_prob,
            "confidence": conf,
            "prediction": eff_pred
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
        print(f"Image Dimensions        : {W}x{H}")
        print(f"Model Input Dimensions  : 380x380")
        print(f"Raw Logits              : [{raw_logit:.6f}]")
        print(f"Class Mapping           : Sigmoid(logit) -> AI Probability")
        print(f"AI Probability          : {ai_prob * 100:.2f}%")
        print(f"Real Probability        : {real_prob * 100:.2f}%")
        print(f"Prediction              : {eff_pred}")
        print(f"Confidence              : {conf * 100:.2f}%")
        print(f"==================================================")

    # -------------------------------------------------------------
    # SIDE-BY-SIDE COMPARISON TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 85)
    print("SIDE-BY-SIDE BENCHMARK COMPARISON TABLE: dima806 vs. EfficientNet-B7")
    print("=" * 85)
    header = f"{'IMAGE':<22} | {'dima806 AI %':<12} | {'dima806 Pred':<20} | {'EfficientNet AI %':<18} | {'EfficientNet Pred':<20}"
    print(header)
    print("-" * 85)

    for i in range(len(test_files)):
        e = eff_results[i]
        d = dima_results[i]
        fname = e["filename"]
        d_ai_str = f"{d['ai_prob'] * 100:.2f}%"
        e_ai_str = f"{e['ai_prob'] * 100:.2f}%"
        print(f"{fname:<22} | {d_ai_str:<12} | {d['prediction']:<20} | {e_ai_str:<18} | {e['prediction']:<20}")

    print("=" * 85)

    # -------------------------------------------------------------
    # ACCURACY & METRICS CALCULATION
    # -------------------------------------------------------------
    print("\n--- EFFICIENTNET-B7 PERFORMANCE METRICS ---")
    eff_tp, eff_tn, eff_fp, eff_fn = 0, 0, 0, 0

    for e in eff_results:
        is_gt_ai = e["ground_truth"] == "AI"
        is_pred_ai = e["prediction"] == "Likely AI Generated"

        if is_gt_ai and is_pred_ai:
            eff_tp += 1
        elif not is_gt_ai and not is_pred_ai:
            eff_tn += 1
        elif not is_gt_ai and is_pred_ai:
            eff_fp += 1
        elif is_gt_ai and not is_pred_ai:
            eff_fn += 1

    total = len(eff_results)
    eff_acc = (eff_tp + eff_tn) / total * 100.0 if total > 0 else 0.0

    print(f"Accuracy                : {eff_acc:.2f}% ({eff_tp + eff_tn}/{total})")
    print(f"True Positives (TP)     : {eff_tp} (AI correctly detected)")
    print(f"True Negatives (TN)     : {eff_tn} (Natural correctly detected)")
    print(f"False Positives (FP)    : {eff_fp} (Natural falsely flagged as AI)")
    print(f"False Negatives (FN)    : {eff_fn} (AI missed as Natural)")
    print("=" * 80)

if __name__ == "__main__":
    run_efficientnet_image_benchmark()
