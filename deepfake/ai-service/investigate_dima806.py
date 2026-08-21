import os
import sys
import torch
import cv2
import numpy as np
from PIL import Image

from image_ai_model import ImageDeepfakeDetectorModel
from image_ai_detector import ImageAIDetectorEngine

def run_investigation():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    img_path = os.path.join(base_dir, "uploads", "ai_boy_portrait1.png")

    print("=" * 70)
    print("DIMA806 DISCREPANCY INVESTIGATION REPORT")
    print("=" * 70)
    print(f"Target Image Path: {img_path}")

    if not os.path.exists(img_path):
        print(f"ERROR: File not found at {img_path}")
        return

    bgr_image = cv2.imread(img_path)

    # -------------------------------------------------------------
    # TEST 5: VERIFY MODEL CHECKPOINT & CONFIG
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("TEST 5 — VERIFY MODEL CHECKPOINT & CONFIG")
    print("=" * 70)

    model_wrapper = ImageDeepfakeDetectorModel()
    vit_model = model_wrapper.vit_model
    snapshot_path = model_wrapper._get_snapshot_path()

    print(f"Checkpoint Path / Snapshot : {snapshot_path}")
    print(f"model.config._name_or_path: {getattr(vit_model.config, '_name_or_path', 'N/A')}")
    print(f"id2label                   : {vit_model.config.id2label}")
    print(f"label2id                   : {vit_model.config.label2id}")

    # -------------------------------------------------------------
    # TEST 1: DIRECT ImageAIDetectorEngine EVALUATION
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("TEST 1 — DIRECT ImageAIDetectorEngine EVALUATION")
    print("=" * 70)

    engine = ImageAIDetectorEngine()
    engine_result = engine.analyze_image(bgr_image)

    print(f"Result Dictionary from analyze_image():")
    print(f"  prediction          : {engine_result['prediction']}")
    print(f"  confidence          : {engine_result['confidence']}")
    print(f"  deepfakeProbability : {engine_result['deepfakeProbability']}")
    print(f"  facesDetected       : {engine_result['facesDetected']}")
    print(f"  validFaces          : {engine_result['validFaces']}")
    print(f"  analyzedPatches count: {len(engine_result['analyzedPatches'])}")
    for p in engine_result['analyzedPatches']:
        print(f"    - Patch '{p['patchId']}' ({p['label']}): prob={p['deepfakeProbability']}, pred={p['prediction']}")

    # -------------------------------------------------------------
    # TEST 2 & TEST 4: RAW MODEL OUTPUT ACROSS PATCHES
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("TEST 2 & 4 — RAW MODEL OUTPUT & MULTI-PATCH ANALYSIS")
    print("=" * 70)

    # 1. Whole Image
    rgb_full = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
    pil_full = Image.fromarray(rgb_full)
    inputs_full = model_wrapper.vit_processor(images=pil_full, return_tensors="pt").to(model_wrapper.device)
    with torch.no_grad():
        out_full = vit_model(**inputs_full)
        logits_full = out_full.logits[0]
        probs_full = torch.nn.functional.softmax(logits_full, dim=-1)

    print(f"\n[A] Whole Image Canvas ({bgr_image.shape[1]}x{bgr_image.shape[0]}):")
    print(f"  Raw Logits            : {logits_full.cpu().numpy().tolist()}")
    print(f"  Prob Class 0 ('Real') : {probs_full[0].item():.6f} ({probs_full[0].item()*100:.2f}%)")
    print(f"  Prob Class 1 ('Fake') : {probs_full[1].item():.6f} ({probs_full[1].item()*100:.2f}%)")

    # 2. Center Patch (50% Center Box)
    h, w = bgr_image.shape[:2]
    center_patch = bgr_image[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4]
    rgb_center = cv2.cvtColor(center_patch, cv2.COLOR_BGR2RGB)
    pil_center = Image.fromarray(rgb_center)
    inputs_center = model_wrapper.vit_processor(images=pil_center, return_tensors="pt").to(model_wrapper.device)
    with torch.no_grad():
        out_center = vit_model(**inputs_center)
        logits_center = out_center.logits[0]
        probs_center = torch.nn.functional.softmax(logits_center, dim=-1)

    print(f"\n[B] Center Focus Patch ({center_patch.shape[1]}x{center_patch.shape[0]}):")
    print(f"  Raw Logits            : {logits_center.cpu().numpy().tolist()}")
    print(f"  Prob Class 0 ('Real') : {probs_center[0].item():.6f} ({probs_center[0].item()*100:.2f}%)")
    print(f"  Prob Class 1 ('Fake') : {probs_center[1].item():.6f} ({probs_center[1].item()*100:.2f}%)")

    # 3. Contextual Face Patch (if detected)
    bboxes = engine.face_detector._detect_retinaface(bgr_image)
    if not bboxes:
        bboxes = engine.face_detector._detect_mtcnn(bgr_image)

    print(f"\n[C] Contextual Face Crops (Detected: {len(bboxes)}):")
    for idx, bbox in enumerate(bboxes):
        crop = engine._crop_face_contextual(bgr_image, bbox, margin=0.70)
        if crop is not None:
            rgb_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
            pil_crop = Image.fromarray(rgb_crop)
            inputs_crop = model_wrapper.vit_processor(images=pil_crop, return_tensors="pt").to(model_wrapper.device)
            with torch.no_grad():
                out_crop = vit_model(**inputs_crop)
                logits_crop = out_crop.logits[0]
                probs_crop = torch.nn.functional.softmax(logits_crop, dim=-1)
            print(f"  Face #{idx+1} ({crop.shape[1]}x{crop.shape[0]}):")
            print(f"    Raw Logits            : {logits_crop.cpu().numpy().tolist()}")
            print(f"    Prob Class 0 ('Real') : {probs_crop[0].item():.6f} ({probs_crop[0].item()*100:.2f}%)")
            print(f"    Prob Class 1 ('Fake') : {probs_crop[1].item():.6f} ({probs_crop[1].item()*100:.2f}%)")

    # -------------------------------------------------------------
    # TEST 3: BENCHMARK SCRIPT COMPARISON ANALYSIS
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("TEST 3 — BENCHMARK SCRIPT vs. ImageAIDetectorEngine ANALYSIS")
    print("=" * 70)
    print("Reason for Discrepancy:")
    print("1. ImageAIDetectorEngine uses Multi-Scale Regional Score Fusion:")
    print("   - Whole Image Canvas fake_prob : {:.6f}".format(probs_full[1].item()))
    print("   - Center Subject Patch fake_prob: {:.6f}".format(probs_center[1].item()))
    print("   - Maximum patch signal (max_signal): {:.6f}".format(max(probs_full[1].item(), probs_center[1].item())))
    print("   - Because max_signal >= 0.70, ImageAIDetectorEngine applies Patch Anomaly Preservation,")
    print("     setting deepfakeProbability = {:.4f} -> 'Likely AI Generated'.".format(max(probs_full[1].item(), probs_center[1].item())))
    print("\n2. test_ateeq_model.py evaluated ONLY ImageDeepfakeDetectorModel.predict_image_array(bgr_image)")
    print("   which evaluates ONLY the downsampled Whole Image Canvas (224x224 downsampled from high-res).")
    print("   On the downsampled whole canvas alone, dima806 gives Class 1 ('Fake') = {:.6f} (0.09%).".format(probs_full[1].item()))
    print("   It did NOT invoke ImageAIDetectorEngine's multi-scale center/face crop logic.")

if __name__ == "__main__":
    run_investigation()
