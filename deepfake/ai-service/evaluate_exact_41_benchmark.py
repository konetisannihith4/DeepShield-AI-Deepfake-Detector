import os
import cv2
import pandas as pd
import numpy as np
from image_ai_detector import ImageAIDetectorEngine

SERVICE_DIR = r"C:\Users\konet\Downloads\Deepshield\deepfake\ai-service"
REFERENCE_CSV = os.path.join(SERVICE_DIR, "xrayon_41_image_benchmark.csv")
OUTPUT_CSV = os.path.join(SERVICE_DIR, "xrayon_41_image_benchmark_096.csv")

def find_file(filename):
    for root, _, files in os.walk(SERVICE_DIR):
        if filename in files:
            return os.path.join(root, filename)
    return None

def evaluate_41_benchmark():
    print("=== EVALUATING EXACT 41-IMAGE BENCHMARK UNDER THRESHOLD 0.96 ===")
    
    if not os.path.exists(REFERENCE_CSV):
        raise FileNotFoundError(f"Reference CSV not found: {REFERENCE_CSV}")
        
    ref_df = pd.read_csv(REFERENCE_CSV)
    engine = ImageAIDetectorEngine()
    
    results = []
    tp = tn = fp = fn = uncertain_cnt = 0
    
    for _, row in ref_df.iterrows():
        fname = row["filename"]
        set_group = row["set_group"]
        category = row["category"]
        gt = row["ground_truth"].strip().upper()
        
        filepath = find_file(fname)
        if not filepath:
            print(f"ERROR: Could not locate specimen file: {fname}")
            continue
            
        bgr = cv2.imread(filepath)
        if bgr is None:
            print(f"ERROR: Unable to decode image: {filepath}")
            continue
            
        res = engine.analyze_image(bgr)
        prob = res["deepfakeProbability"]
        pred = res["prediction"]
        conf = res["confidence"]
        real_prob = round(1.0 - prob, 4)
        
        # Classify metric outcome
        if gt == "AI":
            if pred == "Likely AI Generated":
                outcome = "TP"
                tp += 1
            elif pred == "Uncertain":
                outcome = "UNCERTAIN"
                uncertain_cnt += 1
            else:
                outcome = "FN"
                fn += 1
        else: # NATURAL
            if pred == "Likely Natural":
                outcome = "TN"
                tn += 1
            elif pred == "Uncertain":
                outcome = "UNCERTAIN"
                uncertain_cnt += 1
            else:
                outcome = "FP"
                fp += 1
                
        results.append({
            "filename": fname,
            "ground_truth": gt,
            "category": category,
            "dataset_split": set_group,
            "AI_probability": f"{round(prob * 100, 2)}%",
            "real_probability": f"{round(real_prob * 100, 2)}%",
            "prediction": pred,
            "confidence": f"{round(conf * 100, 2)}%",
            "result_type": outcome
        })
        
    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\n[OK] Saved 41-Image Benchmark CSV to: {OUTPUT_CSV}")
    
    total = len(df)
    ai_total = len(df[df["ground_truth"] == "AI"])
    real_total = len(df[df["ground_truth"] == "NATURAL"])
    
    acc = (tp + tn) / total if total > 0 else 0
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0
    rec = tp / ai_total if ai_total > 0 else 0
    f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0
    fpr = fp / real_total if real_total > 0 else 0
    fnr = fn / ai_total if ai_total > 0 else 0
    
    print("\n==================================================")
    print("FINAL 41-IMAGE BENCHMARK SUMMARY (THRESHOLD 0.96)")
    print("==================================================")
    print(f"Total Images Evaluated : {total} ({ai_total} AI, {real_total} Natural)")
    print(f"True Positives (TP)    : {tp}")
    print(f"True Negatives (TN)    : {tn}")
    print(f"False Positives (FP)   : {fp}")
    print(f"False Negatives (FN)   : {fn}")
    print(f"Uncertain Count        : {uncertain_cnt}")
    print(f"Accuracy               : {acc*100:.2f}%")
    print(f"Precision              : {prec*100:.2f}%")
    print(f"Recall (AI Recall)     : {rec*100:.2f}%")
    print(f"F1 Score               : {f1*100:.2f}%")
    print(f"False Positive Rate    : {fpr*100:.2f}%")
    print(f"False Negative Rate    : {fnr*100:.2f}%\n")
    
    print("--- EXPLICIT FALSE POSITIVES (FP) ---")
    fp_df = df[df["result_type"] == "FP"]
    if not fp_df.empty:
        for _, r in fp_df.iterrows():
            print(f"  - {r['filename']} ({r['category']}): AI Prob={r['AI_probability']}")
    else:
        print("  None")
        
    print("\n--- EXPLICIT FALSE NEGATIVES (FN) ---")
    fn_df = df[df["result_type"] == "FN"]
    if not fn_df.empty:
        for _, r in fn_df.iterrows():
            print(f"  - {r['filename']} ({r['category']}): AI Prob={r['AI_probability']}")
    else:
        print("  None")
        
    print("\n--- EXPLICIT UNCERTAIN SPECIMENS ---")
    unc_df = df[df["result_type"] == "UNCERTAIN"]
    if not unc_df.empty:
        for _, r in unc_df.iterrows():
            print(f"  - {r['filename']} (Ground Truth: {r['ground_truth']}): AI Prob={r['AI_probability']}")
    else:
        print("  None")

if __name__ == "__main__":
    evaluate_41_benchmark()
