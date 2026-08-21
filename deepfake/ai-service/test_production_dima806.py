import os
import sys
import numpy as np
import cv2

from image_ai_detector import ImageAIDetectorEngine

def test_production_engine():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    test_files = [
        ("ai_boy_portrait1.png", "AI"),
        ("ai_boy_portrait2.png", "AI"),
        ("ai_chatgpt.png", "AI"),
        ("ai_specimen3.jpg", "Natural"),
        ("test.jpg.jpg", "Natural")
    ]

    print("=" * 70)
    print("PRODUCTION ImageAIDetectorEngine BENCHMARK")
    print("=" * 70)

    engine = ImageAIDetectorEngine()

    results = []

    for filename, ground_truth in test_files:
        filepath = os.path.join(uploads_dir, filename)
        if not os.path.exists(filepath):
            print(f"ERROR: File not found: {filepath}")
            continue

        with open(filepath, "rb") as f:
            img_bytes = f.read()

        # Run direct production engine predict_image_bytes
        res = engine.predict_image_bytes(img_bytes, filename=filename)

        # Extract patch probabilities
        whole_prob = None
        center_prob = None
        face_probs = []

        for patch in res.get("analyzedPatches", []):
            pid = patch.get("patchId", "")
            prob = patch.get("deepfakeProbability", 0.0)
            if pid == "Canvas":
                whole_prob = prob
            elif pid == "Center Patch":
                center_prob = prob
            elif "Face" in pid:
                face_probs.append(prob)

        final_prob = res.get("deepfakeProbability", 0.0)
        prediction = res.get("prediction", "")
        confidence = res.get("confidence", 0.0)

        # Extract diagnostic aggregation method from logs or compute based on logic
        max_signal = max([p for p in [whole_prob, center_prob] + face_probs if p is not None])
        if max_signal >= 0.70:
            agg_method = "Multi-Scale Patch Anomaly Preservation"
        elif max_signal >= 0.50:
            agg_method = "Multi-Scale Concordant Blend"
        else:
            agg_method = "Multi-Scale Natural Concordance"

        results.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "whole_prob": whole_prob,
            "center_prob": center_prob,
            "face_probs": face_probs,
            "patches": res.get("analyzedPatches", []),
            "final_prob": final_prob,
            "final_ai_pct": f"{final_prob * 100:.2f}%",
            "prediction": prediction,
            "confidence": confidence,
            "aggregation_method": agg_method
        })

        print(f"\n==================================================")
        print(f"IMAGE                   : {filename}")
        print(f"GROUND TRUTH            : {ground_truth}")
        print(f"whole_image_probability : {whole_prob} ({whole_prob*100:.2f}%)")
        print(f"center_patch_probability: {center_prob} ({center_prob*100:.2f}%)")
        print(f"face probabilities      : {face_probs}")
        print(f"all analyzed patches    :")
        for p in res.get("analyzedPatches", []):
            print(f"  - [{p['patchId']}] {p['label']}: prob={p['deepfakeProbability']}, pred={p['prediction']}")
        print(f"final probability       : {final_prob} ({final_prob*100:.2f}%)")
        print(f"final prediction        : {prediction}")
        print(f"confidence              : {confidence}")
        print(f"aggregation method      : {agg_method}")
        print(f"==================================================")

    # -------------------------------------------------------------
    # OUTPUT TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 85)
    print("PRODUCTION ImageAIDetectorEngine SUMMARY BENCHMARK TABLE")
    print("=" * 85)
    header = f"{'Image':<22} | {'Whole':<8} | {'Center':<8} | {'Face':<12} | {'Final AI %':<12} | {'Prediction':<20}"
    print(header)
    print("-" * 85)

    for r in results:
        fname = r["filename"]
        w_str = f"{r['whole_prob']*100:.1f}%" if r["whole_prob"] is not None else "N/A"
        c_str = f"{r['center_prob']*100:.1f}%" if r["center_prob"] is not None else "N/A"
        f_str = ", ".join([f"{fp*100:.1f}%" for fp in r["face_probs"]]) if r["face_probs"] else "None"
        fin_str = r["final_ai_pct"]
        pred_str = r["prediction"]
        print(f"{fname:<22} | {w_str:<8} | {c_str:<8} | {f_str:<12} | {fin_str:<12} | {pred_str:<20}")

    print("=" * 85)

    # -------------------------------------------------------------
    # METRICS CALCULATION
    # -------------------------------------------------------------
    tp = 0
    tn = 0
    fp = 0
    fn = 0

    for r in results:
        is_gt_ai = r["ground_truth"] == "AI"
        is_pred_ai = r["prediction"] == "Likely AI Generated"

        if is_gt_ai and is_pred_ai:
            tp += 1
        elif not is_gt_ai and not is_pred_ai:
            tn += 1
        elif not is_gt_ai and is_pred_ai:
            fp += 1
        elif is_gt_ai and not is_pred_ai:
            fn += 1

    total = len(results)
    accuracy = (tp + tn) / total if total > 0 else 0.0

    print("\n--- PERFORMANCE METRICS ---")
    print(f"Accuracy                : {accuracy * 100:.2f}% ({tp + tn}/{total})")
    print(f"True Positives (TP)     : {tp} (AI correctly detected)")
    print(f"True Negatives (TN)     : {tn} (Natural correctly detected)")
    print(f"False Positives (FP)    : {fp} (Natural falsely flagged as AI)")
    print(f"False Negatives (FN)    : {fn} (AI missed as Natural)")

    # -------------------------------------------------------------
    # SPECIAL CHECK (>70% AI Patch Analysis)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("SPECIAL CHECK: PATCH ANOMALY ANALYSIS (>70% AI PATCHES)")
    print("=" * 70)

    for r in results:
        whole = r["whole_prob"] or 0.0
        high_patches = [p for p in r["patches"] if p["deepfakeProbability"] >= 0.70]
        
        if whole < 0.50 and high_patches:
            print(f"\nSpecimen: {r['filename']} (Ground Truth: {r['ground_truth']})")
            print(f"  - Whole Image Canvas Probability: {whole*100:.2f}% (Likely Natural)")
            print(f"  - Patches with >= 70% AI Probability:")
            for hp in high_patches:
                print(f"    * [{hp['patchId']}] {hp['label']}: {hp['deepfakeProbability']*100:.2f}% AI")
            
            if r["ground_truth"] == "Natural":
                print(f"  -> FLAG: POTENTIAL FALSE POSITIVE! Natural image generated a >70% AI signal in patch: {[hp['patchId'] for hp in high_patches]}")
            else:
                print(f"  -> VALID SYNTHETIC SIGNAL: AI image downsampling false negative recovered by patch: {[hp['patchId'] for hp in high_patches]}")

if __name__ == "__main__":
    test_production_engine()
