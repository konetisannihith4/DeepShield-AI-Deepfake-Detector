import os
import sys
import numpy as np
import cv2
from typing import Dict, List, Tuple, Any

from image_ai_model import ImageDeepfakeDetectorModel
from video.face_detector import FaceDetector

def get_3x3_grid_crops(image: np.ndarray) -> List[Tuple[str, Tuple[int, int, int, int], np.ndarray]]:
    """
    Generates 3x3 overlapping grid crops (50% canvas size per patch) across the image.
    Returns list of (crop_name, (x, y, w, h), crop_image_array).
    """
    H, W = image.shape[:2]
    h = max(30, H // 2)
    w = max(30, W // 2)

    y_coords = [0, (H - h) // 2, H - h]
    x_coords = [0, (W - w) // 2, W - w]

    grid_names = [
        ["Top-Left", "Top-Center", "Top-Right"],
        ["Middle-Left", "Grid-Center", "Middle-Right"],
        ["Bottom-Left", "Bottom-Center", "Bottom-Right"]
    ]

    crops = []
    for r in range(3):
        for c in range(3):
            y = max(0, y_coords[r])
            x = max(0, x_coords[c])
            crop_h = min(h, H - y)
            crop_w = min(w, W - x)

            crop_img = image[y:y+crop_h, x:x+crop_w]
            name = f"Grid-{grid_names[r][c]}"
            crops.append((name, (x, y, crop_w, crop_h), crop_img))

    return crops

def run_experiment():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_dir = os.path.join(base_dir, "uploads")

    test_files = [
        ("ai_boy_portrait1.png", "AI"),
        ("ai_boy_portrait2.png", "AI"),
        ("ai_chatgpt.png", "AI"),
        ("ai_specimen3.jpg", "Natural"),
        ("test.jpg.jpg", "Natural")
    ]

    print("=" * 80)
    print("MULTISCALE V2 GRID PATCH EXPERIMENT (dima806)")
    print("=" * 80)

    model = ImageDeepfakeDetectorModel()
    face_detector = FaceDetector()

    all_image_results = []

    for filename, ground_truth in test_files:
        filepath = os.path.join(uploads_dir, filename)
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            continue

        bgr_image = cv2.imread(filepath)
        H, W = bgr_image.shape[:2]

        patch_records = [] # list of dicts: {name, x, y, w, h, fake_prob}

        # 1. Whole Image Canvas
        _, whole_fake_prob = model.predict_image_array(bgr_image)
        patch_records.append({
            "name": "Whole-Image Canvas",
            "coords": (0, 0, W, H),
            "w": W, "h": H,
            "fake_prob": whole_fake_prob
        })

        # 2. Legacy Center 50% Crop
        center_patch = bgr_image[H // 4 : 3 * H // 4, W // 4 : 3 * W // 4]
        if center_patch.size > 0:
            _, center_fake_prob = model.predict_image_array(center_patch)
            patch_records.append({
                "name": "Legacy Center 50%",
                "coords": (W // 4, H // 4, W // 2, H // 2),
                "w": W // 2, "h": H // 2,
                "fake_prob": center_fake_prob
            })
        else:
            center_fake_prob = whole_fake_prob

        # 3. Face Crop(s)
        bboxes = face_detector._detect_retinaface(bgr_image)
        if not bboxes:
            bboxes = face_detector._detect_mtcnn(bgr_image)

        face_probs = []
        for idx, bbox in enumerate(bboxes):
            x, y, bw, bh = bbox
            pad_w = int(bw * 0.70)
            pad_h = int(bh * 0.70)
            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(W, x + bw + pad_w)
            y2 = min(H, y + bh + pad_h)
            crop = bgr_image[y1:y2, x1:x2]
            if crop.size > 0:
                _, f_fake_prob = model.predict_image_array(crop)
                face_probs.append(f_fake_prob)
                patch_records.append({
                    "name": f"Face Crop #{idx+1}",
                    "coords": (x1, y1, x2 - x1, y2 - y1),
                    "w": x2 - x1, "h": y2 - y1,
                    "fake_prob": f_fake_prob
                })

        # 4. 3x3 Overlapping Grid Crops
        grid_crops = get_3x3_grid_crops(bgr_image)
        for name, coords, crop_img in grid_crops:
            _, g_fake_prob = model.predict_image_array(crop_img)
            patch_records.append({
                "name": name,
                "coords": coords,
                "w": coords[2], "h": coords[3],
                "fake_prob": g_fake_prob
            })

        # Gather probability distributions
        all_probs = [p["fake_prob"] for p in patch_records]
        sorted_probs = sorted(all_probs, reverse=True)

        highest = sorted_probs[0]
        second_highest = sorted_probs[1] if len(sorted_probs) > 1 else sorted_probs[0]
        third_highest = sorted_probs[2] if len(sorted_probs) > 2 else sorted_probs[-1]
        mean_prob = float(np.mean(all_probs))
        median_prob = float(np.median(all_probs))

        # Candidate Aggregation Strategies:
        # A. max patch
        strat_A_prob = highest
        strat_A_pred = "Likely AI Generated" if strat_A_prob >= 0.50 else "Likely Natural"

        # B. top-2 average
        strat_B_prob = (highest + second_highest) / 2.0
        strat_B_pred = "Likely AI Generated" if strat_B_prob >= 0.50 else "Likely Natural"

        # C. top-3 average
        strat_C_prob = (highest + second_highest + third_highest) / 3.0
        strat_C_pred = "Likely AI Generated" if strat_C_prob >= 0.50 else "Likely Natural"

        # D. max + whole-image evidence:
        if highest >= 0.70 and (whole_fake_prob >= 0.10 or second_highest >= 0.40):
            strat_D_prob = highest
        elif highest >= 0.60 and second_highest >= 0.60:
            strat_D_prob = (highest + second_highest) / 2.0
        else:
            strat_D_prob = 0.5 * highest + 0.5 * whole_fake_prob
        strat_D_pred = "Likely AI Generated" if strat_D_prob >= 0.50 else "Likely Natural"

        # E. top-2 + whole-image evidence:
        top2_avg = (highest + second_highest) / 2.0
        strat_E_prob = 0.6 * top2_avg + 0.4 * whole_fake_prob
        strat_E_pred = "Likely AI Generated" if strat_E_prob >= 0.50 else "Likely Natural"

        # F. Dual-Patch Concordance (Top-2 Thresholding):
        dual_patch_match = sum(1 for p in sorted_probs if p >= 0.50) >= 2
        strat_F_prob = top2_avg if dual_patch_match else whole_fake_prob
        strat_F_pred = "Likely AI Generated" if strat_F_prob >= 0.50 else "Likely Natural"

        img_res = {
            "filename": filename,
            "ground_truth": ground_truth,
            "patch_records": patch_records,
            "highest": highest,
            "second_highest": second_highest,
            "third_highest": third_highest,
            "mean_prob": mean_prob,
            "median_prob": median_prob,
            "whole_prob": whole_fake_prob,
            "face_probs": face_probs,
            "strategies": {
                "A_max": (strat_A_prob, strat_A_pred),
                "B_top2_avg": (strat_B_prob, strat_B_pred),
                "C_top3_avg": (strat_C_prob, strat_C_pred),
                "D_max_whole": (strat_D_prob, strat_D_pred),
                "E_top2_whole": (strat_E_prob, strat_E_pred),
                "F_dual_patch": (strat_F_prob, strat_F_pred)
            }
        }
        all_image_results.append(img_res)

        print(f"\n" + "=" * 60)
        print(f"IMAGE: {filename} (Ground Truth: {ground_truth})")
        print("=" * 60)
        print("ALL PATCHES EVALUATED:")
        for p in patch_records:
            coords_str = f"({p['coords'][0]}, {p['coords'][1]})"
            print(f"  - {p['name']:<22} | Coords: {coords_str:<12} | Dim: {p['w']}x{p['h']:<6} | AI Prob: {p['fake_prob']*100:6.2f}%")

        print(f"\nPROBABILITY STATS:")
        print(f"  Highest Patch AI Prob     : {highest*100:.2f}%")
        print(f"  Second Highest AI Prob    : {second_highest*100:.2f}%")
        print(f"  Third Highest AI Prob     : {third_highest*100:.2f}%")
        print(f"  Mean Patch AI Prob        : {mean_prob*100:.2f}%")
        print(f"  Median Patch AI Prob      : {median_prob*100:.2f}%")
        print(f"  Whole-Image Canvas Prob   : {whole_fake_prob*100:.2f}%")
        print(f"  Face Crop Probs           : {[round(fp*100, 2) for fp in face_probs] if face_probs else 'None'}")

        print(f"\nCANDIDATE AGGREGATION RESULTS FOR {filename}:")
        print(f"  Strategy A (Max Patch)              : {strat_A_prob*100:6.2f}% -> {strat_A_pred}")
        print(f"  Strategy B (Top-2 Average)          : {strat_B_prob*100:6.2f}% -> {strat_B_pred}")
        print(f"  Strategy C (Top-3 Average)          : {strat_C_prob*100:6.2f}% -> {strat_C_pred}")
        print(f"  Strategy D (Max + Whole Evidence)   : {strat_D_prob*100:6.2f}% -> {strat_D_pred}")
        print(f"  Strategy E (Top-2 + Whole Evidence) : {strat_E_prob*100:6.2f}% -> {strat_E_pred}")
        print(f"  Strategy F (Dual-Patch Concordance) : {strat_F_prob*100:6.2f}% -> {strat_F_pred}")

    # -------------------------------------------------------------
    # STRATEGY COMPARISON & EVALUATION SUMMARY TABLE
    # -------------------------------------------------------------
    print("\n" + "=" * 90)
    print("STRATEGY PERFORMANCE COMPARISON TABLE ACROSS ALL 5 IMAGES")
    print("=" * 90)

    strategies_keys = [
        ("A_max", "A: Max Patch"),
        ("B_top2_avg", "B: Top-2 Avg"),
        ("C_top3_avg", "C: Top-3 Avg"),
        ("D_max_whole", "D: Max+Whole"),
        ("E_top2_whole", "E: Top2+Whole"),
        ("F_dual_patch", "F: Dual-Patch")
    ]

    for key, name in strategies_keys:
        tp, tn, fp, fn = 0, 0, 0, 0
        print(f"\n--- {name} ---")
        header = f"{'Image':<22} | {'GT':<8} | {'Prob %':<10} | {'Prediction':<20} | {'Status':<10}"
        print(header)
        print("-" * 75)

        for res in all_image_results:
            fname = res["filename"]
            gt = res["ground_truth"]
            prob, pred = res["strategies"][key]
            is_gt_ai = gt == "AI"
            is_pred_ai = pred == "Likely AI Generated"

            if is_gt_ai and is_pred_ai:
                tp += 1
                status = "TP [OK]"
            elif not is_gt_ai and not is_pred_ai:
                tn += 1
                status = "TN [OK]"
            elif not is_gt_ai and is_pred_ai:
                fp += 1
                status = "FP [ERR]"
            elif is_gt_ai and not is_pred_ai:
                fn += 1
                status = "FN [ERR]"

            print(f"{fname:<22} | {gt:<8} | {prob*100:6.2f}%    | {pred:<20} | {status:<10}")

        total = len(all_image_results)
        acc = (tp + tn) / total * 100.0
        print(f"Accuracy: {acc:.1f}% ({tp+tn}/{total}) | TP: {tp} | TN: {tn} | FP: {fp} | FN: {fn}")

if __name__ == "__main__":
    run_experiment()
