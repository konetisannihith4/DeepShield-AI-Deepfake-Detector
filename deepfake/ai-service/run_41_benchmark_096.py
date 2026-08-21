import os
import cv2
import pandas as pd
import numpy as np
from image_ai_detector import ImageAIDetectorEngine

BENCHMARK_DIR = r"C:\Users\konet\Downloads\Deepshield\deepfake\ai-service\uploads"
OUTPUT_CSV = r"C:\Users\konet\Downloads\Deepshield\deepfake\ai-service\xrayon_41_image_benchmark_096.csv"

# Complete 41-Image Specifications
SPECIMENS = [
    # --- Previous 26 Images ---
    # Real Camera Photos (10)
    ("real_camera_person.jpg", "NATURAL", "Real Camera Person", "previous_26"),
    ("real_camera_landscape.jpg", "NATURAL", "Real Camera Landscape", "previous_26"),
    ("real_camera_nature.jpg", "NATURAL", "Real Camera Nature", "previous_26"),
    ("real_camera_teapot.jpg", "NATURAL", "Real Camera Teapot", "previous_26"),
    ("real_camera_tiger.jpg", "NATURAL", "Real Camera Tiger", "previous_26"),
    ("real_edited_color_adjust.jpg", "NATURAL", "Real Edited Color Adjust", "previous_26"),
    ("real_edited_gaussian_blur.jpg", "NATURAL", "Real Edited Gaussian Blur", "previous_26"),
    ("real_edited_jpeg_q30.jpg", "NATURAL", "Real Edited JPEG Q30", "previous_26"),
    ("real_edited_jpeg_q50.jpg", "NATURAL", "Real Edited JPEG Q50", "previous_26"),
    ("real_edited_resample_0.5x.jpg", "NATURAL", "Real Edited Resample 0.5x", "previous_26"),
    
    # Previous AI Images (16)
    ("ai_boy_portrait2.png", "AI", "AI Boy Portrait 2", "previous_26"),
    ("ai_sdxl_landscape.jpg", "AI", "AI SDXL Landscape", "previous_26"),
    ("ai_sdxl_img2img.jpg", "AI", "AI SDXL Img2Img", "previous_26"),
    ("ai_gan_bedroom.jpg", "AI", "AI GAN Bedroom", "previous_26"),
    ("ai_midjourney_v6_cat.jpg", "AI", "AI Midjourney V6 Cat", "previous_26"),
    ("ai_flux_portrait.jpg", "AI", "AI Flux Portrait", "previous_26"),
    ("ai_dalle3_cyberpunk.jpg", "AI", "AI DALL-E 3 Cyberpunk", "previous_26"),
    ("ai_sd35_architecture.jpg", "AI", "AI SD 3.5 Architecture", "previous_26"),
    ("ai_progan_face.jpg", "AI", "AI ProGAN Face", "previous_26"),
    ("ai_stylegan2_face.jpg", "AI", "AI StyleGAN2 Face", "previous_26"),
    ("ai_deepfake_swap.jpg", "AI", "AI DeepFake Swap", "previous_26"),
    ("ai_stable_diffusion_v15.jpg", "AI", "AI SD 1.5", "previous_26"),
    ("ai_midjourney_v5_food.jpg", "AI", "AI Midjourney V5 Food", "previous_26"),
    ("ai_firefly_nature.jpg", "AI", "AI Adobe Firefly Nature", "previous_26"),
    ("ai_flux_car.jpg", "AI", "AI Flux Car", "previous_26"),
    ("ai_dalle2_object.jpg", "AI", "AI DALL-E 2 Object", "previous_26"),

    # --- Unseen 15 Images ---
    # Unseen AI Images (10)
    ("unseen_ai_01_animal.jpg", "AI", "Unseen AI Animal", "unseen_15"),
    ("unseen_ai_02_portrait.jpg", "AI", "Unseen AI Portrait", "unseen_15"),
    ("unseen_ai_03_landscape.jpg", "AI", "Unseen AI Landscape", "unseen_15"),
    ("unseen_ai_04_city.jpg", "AI", "Unseen AI City", "unseen_15"),
    ("unseen_ai_05_house_interior.jpg", "AI", "Unseen AI House Interior", "unseen_15"),
    ("unseen_ai_06_food.jpg", "AI", "Unseen AI Food", "unseen_15"),
    ("unseen_ai_07_vehicle.jpg", "AI", "Unseen AI Vehicle", "unseen_15"),
    ("unseen_ai_08_artwork.jpg", "AI", "Unseen AI Artwork", "unseen_15"),
    ("unseen_ai_09_robot.jpg", "AI", "Unseen AI Robot", "unseen_15"),
    ("unseen_ai_10_fantasy.jpg", "AI", "Unseen AI Fantasy", "unseen_15"),
    
    # Unseen Real Photos (5)
    ("unseen_real_01_street_market.jpg", "NATURAL", "Unseen Real Street Market", "unseen_15"),
    ("unseen_real_02_portrait.jpg", "NATURAL", "Unseen Real Portrait", "unseen_15"),
    ("unseen_real_03_architecture.jpg", "NATURAL", "Unseen Real Architecture", "unseen_15"),
    ("unseen_real_04_food_dish.jpg", "NATURAL", "Unseen Real Food Dish", "unseen_15"),
    ("unseen_real_05_wildlife.jpg", "NATURAL", "Unseen Real Wildlife", "unseen_15")
]

def run_41_benchmark():
    print("=== RUNNING 41-IMAGE BENCHMARK WITH THRESHOLD 0.96 ===")
    
    engine = ImageAIDetectorEngine()
    
    results = []
    tp = tn = fp = fn = uncertain_cnt = 0
    
    for filename, ground_truth, label_desc, dataset_split in SPECIMENS:
        filepath = os.path.join(BENCHMARK_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Warning: File missing: {filepath}")
            continue
            
        bgr = cv2.imread(filepath)
        res = engine.analyze_image(bgr)
        
        prob = res["deepfakeProbability"]
        pred = res["prediction"]
        conf = res["confidence"]
        
        real_prob = round(1.0 - prob, 4)
        
        # Result type classification
        if ground_truth == "AI":
            if pred == "Likely AI Generated":
                res_type = "TP"
                tp += 1
            elif pred == "Uncertain":
                res_type = "UNCERTAIN"
                uncertain_cnt += 1
            else:
                res_type = "FN"
                fn += 1
        else: # NATURAL
            if pred == "Likely Natural":
                res_type = "TN"
                tn += 1
            elif pred == "Uncertain":
                res_type = "UNCERTAIN"
                uncertain_cnt += 1
            else:
                res_type = "FP"
                fp += 1
                
        results.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "category": label_desc,
            "dataset_split": dataset_split,
            "AI_probability": f"{round(prob * 100, 2)}%",
            "real_probability": f"{round(real_prob * 100, 2)}%",
            "prediction": pred,
            "confidence": f"{round(conf * 100, 2)}%",
            "result_type": res_type
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
    print("41-IMAGE BENCHMARK SUMMARY (THRESHOLD 0.96)")
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
    
    # List Explicitly FP, FN, UNCERTAIN
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
    run_41_benchmark()
