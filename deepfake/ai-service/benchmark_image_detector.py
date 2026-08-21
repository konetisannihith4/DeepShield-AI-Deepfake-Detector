import os
import sys
import csv
import cv2
import numpy as np

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

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

def run_benchmark():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")
    csv_path = os.path.join(base_dir, "image_benchmark_results.csv")

    print("=" * 80)
    print("COMPREHENSIVE ImageAIDetectorEngine BENCHMARK REPORT (26 SPECIMENS)")
    print("=" * 80)

    if not os.path.exists(uploads_dir):
        print(f"ERROR: Uploads directory not found: {uploads_dir}")
        return

    # Scan uploads directory for image files
    all_files = sorted(os.listdir(uploads_dir))
    image_files = [f for f in all_files if os.path.splitext(f.lower())[1] in IMAGE_EXTENSIONS]

    print(f"Total image files discovered in uploads/: {len(image_files)}")
    for img_name in image_files:
        gt_status = KNOWN_GROUND_TRUTH.get(img_name, "UNLABELED")
        print(f"  - {img_name:<35} [Ground Truth: {gt_status}]")

    print("\nInitializing Production ImageAIDetectorEngine...")
    engine = ImageAIDetectorEngine()

    benchmark_rows = []
    known_eval_list = []

    print("\n" + "=" * 80)
    print("RUNNING INFERENCE ACROSS ALL 26 SPECIMENS")
    print("=" * 80)

    for filename in image_files:
        filepath = os.path.join(uploads_dir, filename)

        # Read image to extract dimensions
        img_bgr = cv2.imread(filepath)
        if img_bgr is None:
            print(f"Warning: Unable to read image {filename}, skipping.")
            continue

        H, W = img_bgr.shape[:2]

        with open(filepath, "rb") as f:
            image_bytes = f.read()

        # Run production engine inference
        res = engine.predict_image_bytes(image_bytes, filename=filename)

        whole_prob = 0.0
        center_prob = 0.0
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

        all_patch_probs = [p.get("deepfakeProbability", 0.0) for p in res.get("analyzedPatches", [])]
        max_patch_prob = max(all_patch_probs) if all_patch_probs else whole_prob

        final_prob = res.get("deepfakeProbability", 0.0)
        prediction = res.get("prediction", "")
        confidence = res.get("confidence", 0.0)
        ground_truth = KNOWN_GROUND_TRUTH.get(filename, "")

        print(f"\n==================================================")
        print(f"filename                 : {filename}")
        print(f"ground_truth             : {ground_truth}")
        print(f"width                    : {W}")
        print(f"height                   : {H}")
        print(f"whole_image_probability  : {whole_prob:.6f} ({whole_prob*100:.2f}%)")
        print(f"center_patch_probability : {center_prob:.6f} ({center_prob*100:.2f}%)")
        print(f"face_probabilities       : {[round(fp, 6) for fp in face_probs] if face_probs else 'None'}")
        print(f"maximum_patch_probability: {max_patch_prob:.6f} ({max_patch_prob*100:.2f}%)")
        print(f"final_probability        : {final_prob:.6f} ({final_prob*100:.2f}%)")
        print(f"prediction               : {prediction}")
        print(f"confidence               : {confidence:.4f}")
        print(f"==================================================")

        benchmark_rows.append({
            "filename": filename,
            "ground_truth": ground_truth,
            "whole_probability": f"{whole_prob:.6f}",
            "center_probability": f"{center_prob:.6f}",
            "max_patch_probability": f"{max_patch_prob:.6f}",
            "final_probability": f"{final_prob:.6f}",
            "prediction": prediction,
            "confidence": f"{confidence:.4f}"
        })

        if ground_truth:
            known_eval_list.append({
                "filename": filename,
                "ground_truth": ground_truth,
                "final_prob": final_prob,
                "prediction": prediction
            })

    # Write CSV Report
    fieldnames = [
        "filename",
        "ground_truth",
        "whole_probability",
        "center_probability",
        "max_patch_probability",
        "final_probability",
        "prediction",
        "confidence"
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(benchmark_rows)

    print(f"\n[OK] Saved benchmark CSV report to: {csv_path}")

    # -------------------------------------------------------------
    # METRICS CALCULATION FOR KNOWN-LABEL IMAGES ONLY
    # -------------------------------------------------------------
    tp, tn, fp, fn = 0, 0, 0, 0
    ai_detected_count = 0
    natural_detected_count = 0

    for item in known_eval_list:
        gt = item["ground_truth"]
        pred = item["prediction"]
        is_pred_ai = pred == "Likely AI Generated"

        if is_pred_ai:
            ai_detected_count += 1
        else:
            natural_detected_count += 1

        if gt == "AI" and is_pred_ai:
            tp += 1
        elif gt == "NATURAL" and not is_pred_ai:
            tn += 1
        elif gt == "NATURAL" and is_pred_ai:
            fp += 1
        elif gt == "AI" and not is_pred_ai:
            fn += 1

    total_tested = len(image_files)
    total_known = len(known_eval_list)

    accuracy = (tp + tn) / total_known if total_known > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    print("\n" + "=" * 80)
    print("FINAL BENCHMARK SUMMARY METRICS (26 SPECIMENS)")
    print("=" * 80)
    print(f"1. Total images tested      : {total_tested}")
    print(f"2. Known-label images       : {total_known}")
    print(f"3. AI detected              : {ai_detected_count}")
    print(f"4. Natural detected         : {natural_detected_count}")
    print(f"5. False positives          : {fp}")
    print(f"6. False negatives          : {fn}")
    print(f"7. Accuracy                 : {accuracy * 100:.2f}% ({accuracy:.4f})")
    print(f"8. Precision                : {precision * 100:.2f}% ({precision:.4f})")
    print(f"9. Recall                   : {recall * 100:.2f}% ({recall:.4f})")
    print(f"10. F1                      : {f1 * 100:.2f}% ({f1:.4f})")
    print("=" * 80)

if __name__ == "__main__":
    run_benchmark()
