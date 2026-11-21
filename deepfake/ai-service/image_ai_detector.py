"""
Dedicated AI-Generated Image Detection Engine

Pipeline Architecture:
1. Whole-Image Vision Transformer (ViT-Base dima806): Evaluates global image canvas.
2. Contextual Face Patch Analysis (when faces present): Evaluates face regions using 70% padding margin.
3. Center Region Patch Analysis (50% Center Box): Preserves high-resolution focal synthetic features
   to prevent resolution-loss false negatives when downsampling high-res images directly to 224x224.
4. Multi-Scale Regional Anomaly Preservation: Preserves strong synthetic AI markers (>= 0.70) detected
   in any focal region while maintaining clean natural concordance on genuine optical photos.
5. Visual Region Extraction: Generates base64 thumbnails for analyzed face crops and focal regions
   to display in the React frontend Analyzed Regions gallery.
"""

import os
import cv2
import base64
import numpy as np
import torch
from typing import Dict, Any, List, Optional, Tuple

from image_ai_model import ImageDeepfakeDetectorModel
from video.face_detector import FaceDetector


def _encode_bgr_to_base64(image: np.ndarray, max_dim: int = 320) -> str:
    """Resizes BGR crop to max_dim and encodes to JPEG Base64 Data URL string."""
    if image is None or image.size == 0:
        return ""
    h, w = image.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        resized = image

    success, buffer = cv2.imencode('.jpg', resized, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    if not success:
        return ""
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64_str}"


class ImageAIDetectorEngine:
    """
    Production Multi-Scale AI-Generated Image Detection Engine.
    Uses dima806/deepfake_vs_real_image_detection ViT model.
    """

    def __init__(self):
        print("\n-------------------------------------------------")
        print("[Image AI Engine] Initializing Multi-Scale Image AI Detector...")

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Image AI Engine] Device: {self.device}")

        # 1. Dedicated dima806 ViT Image Model
        self.image_model = ImageDeepfakeDetectorModel()

        # 2. Face Detector (Shared detector module for face localization)
        self.face_detector = FaceDetector()

        print(f"[Image AI Engine] Multi-Scale Image Detection Engine Ready.")
        print("-------------------------------------------------\n")

    def _analyze_image_quality(self, image: np.ndarray) -> Dict[str, Any]:
        """Calculates visual metrics: sharpness, brightness, and contrast."""
        if image is None or image.size == 0:
            return {"sharpness": 0.0, "brightness": 0.0, "contrast": 0.0}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        return {
            "sharpness": round(sharpness, 2),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2)
        }

    def _crop_face_contextual(self, image: np.ndarray, bbox: Tuple[int, int, int, int], margin: float = 0.70) -> Optional[np.ndarray]:
        """
        Crops face region with contextual padding (70% margin around bounding box)
        to include head, hair, chin, and surrounding canvas context.
        bbox format: (x, y, w, h)
        """
        img_h, img_w = image.shape[:2]
        x, y, w, h = bbox

        if w < 30 or h < 30:
            return None

        pad_w = int(w * margin)
        pad_h = int(h * margin)

        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(img_w, x + w + pad_w)
        y2 = min(img_h, y + h + pad_h)

        crop_w = x2 - x1
        crop_h = y2 - y1

        if crop_w < 30 or crop_h < 30:
            return None

        return image[y1:y2, x1:x2]

    def _generate_explanation(
        self,
        probability: float,
        prediction: str,
        faces_detected: int,
        image_quality: Dict[str, Any],
        face_results: List[Dict[str, Any]]
    ) -> List[str]:
        """Generates detailed diagnostic explanation notes for the user."""
        reasons = []

        if probability >= 0.75:
            reasons.append(
                "Global Vision Transformer (ViT) detected strong synthetic patch patterns across the image canvas."
            )
        elif probability >= 0.60:
            reasons.append(
                "Whole-image analysis identified visual artifacts characteristic of generative AI tools."
            )
        elif probability <= 0.25:
            reasons.append(
                "Global Vision Transformer analysis found structural lighting and texture patterns strongly consistent with natural photography."
            )
        elif probability <= 0.40:
            reasons.append(
                "Whole-image analysis found predominant evidence of natural optical capture."
            )
        else:
            reasons.append(
                "The global image features lie near the decision boundary (40%-60%), indicating uncertain synthetic hallmarks."
            )

        if faces_detected == 0:
            reasons.append(
                "No human face was detected; full canvas background and structural textures were evaluated."
            )
        elif faces_detected == 1:
            if face_results:
                f_prob = face_results[0]["deepfakeProbability"]
                reasons.append(
                    f"1 human face detected. Contextual facial crop score: {round(f_prob * 100, 1)}% AI probability."
                )
            else:
                reasons.append("1 human face was detected and evaluated.")
        else:
            reasons.append(
                f"{faces_detected} human faces were detected and evaluated across individual contextual face crops."
            )

        sharpness = image_quality.get("sharpness", 0)
        if sharpness < 30:
            reasons.append("The image displays low sharpness/blurriness, which may slightly reduce confidence.")
        elif sharpness > 150:
            reasons.append("The specimen exhibits high sharpness suitable for fine-grained synthetic artifact analysis.")

        if prediction == "Uncertain":
            reasons.append("Verdict is classified as 'Uncertain' to avoid false positives on ambiguous content.")

        return reasons

    def analyze_image(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes a single BGR image specimen across multi-scale regional patches.
        Returns structured dictionary response including base64 crop thumbnails.
        """
        if image is None or image.size == 0:
            raise ValueError("Invalid or empty image specimen provided.")

        h, w = image.shape[:2]

        # 1. Image Quality Analysis
        image_quality = self._analyze_image_quality(image)

        # 2. Whole-Image ViT Evaluation (Global Canvas)
        real_prob, full_image_fake_prob = self.image_model.predict_image_array(image)
        full_image_b64 = _encode_bgr_to_base64(image)

        # 3. Center Focus Region Patch (50% Center Box)
        # Prevents feature loss when downsampling high-resolution images to 224x224
        center_patch = image[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4]
        if center_patch.size > 0:
            _, center_fake_prob = self.image_model.predict_image_array(center_patch)
            center_patch_b64 = _encode_bgr_to_base64(center_patch)
        else:
            center_fake_prob = full_image_fake_prob
            center_patch_b64 = full_image_b64

        # 4. Face Detection & Contextual Face Crops
        bboxes = self.face_detector._detect_retinaface(image)
        if not bboxes:
            bboxes = self.face_detector._detect_mtcnn(image)
        if not bboxes:
            bboxes = self.face_detector._detect_opencv_fallback(image)

        face_crops = []
        for bbox in bboxes:
            crop = self._crop_face_contextual(image, bbox, margin=0.70)
            if crop is not None:
                face_crops.append(crop)

        faces_detected = len(bboxes)
        valid_faces = len(face_crops)

        face_results = []
        face_fake_probs = []
        analyzed_patches = []

        # Always add Full Image Canvas patch item
        analyzed_patches.append({
            "patchId": "Canvas",
            "label": "Global Image Canvas",
            "deepfakeProbability": round(float(full_image_fake_prob), 4),
            "prediction": "Likely AI Generated" if full_image_fake_prob >= 0.50 else "Likely Natural",
            "confidence": round(float(max(full_image_fake_prob, 1.0 - full_image_fake_prob)), 4),
            "imageBase64": full_image_b64
        })

        # Add Center Focal Region patch item
        analyzed_patches.append({
            "patchId": "Center Patch",
            "label": "Focal Subject Patch",
            "deepfakeProbability": round(float(center_fake_prob), 4),
            "prediction": "Likely AI Generated" if center_fake_prob >= 0.50 else "Likely Natural",
            "confidence": round(float(max(center_fake_prob, 1.0 - center_fake_prob)), 4),
            "imageBase64": center_patch_b64
        })

        if face_crops:
            face_fake_probs = self.image_model.predict_batch_crops(face_crops)
            for idx, crop in enumerate(face_crops):
                fprob = face_fake_probs[idx]
                f_pred = "Likely AI Generated" if fprob >= 0.50 else "Likely Natural"
                f_conf = max(fprob, 1.0 - fprob)
                crop_b64 = _encode_bgr_to_base64(crop)

                face_item = {
                    "faceIndex": idx + 1,
                    "deepfakeProbability": round(float(fprob), 4),
                    "prediction": f_pred,
                    "confidence": round(float(f_conf), 4),
                    "imageBase64": crop_b64
                }
                face_results.append(face_item)

                analyzed_patches.append({
                    "patchId": f"Face {idx + 1}",
                    "label": f"Contextual Face #{idx + 1}",
                    "deepfakeProbability": round(float(fprob), 4),
                    "prediction": f_pred,
                    "confidence": round(float(f_conf), 4),
                    "imageBase64": crop_b64
                })

        # 5. Multi-Scale Regional Score Fusion & Anomaly Preservation
        regional_signals = [full_image_fake_prob, center_fake_prob]
        if face_fake_probs:
            regional_signals.extend(face_fake_probs)

        max_signal = float(np.max(regional_signals))
        avg_signal = float(np.mean(regional_signals))

        # Anomaly Preservation Rule:
        # If ANY focal region (face crop or center subject patch) exhibits strong synthetic markers (>= 0.70),
        # preserve the synthetic AI signal!
        if max_signal >= 0.70:
            raw_prob = max_signal
            aggregation_method = "Multi-Scale Patch Anomaly Preservation"
        elif max_signal >= 0.50:
            raw_prob = 0.60 * max_signal + 0.40 * avg_signal
            aggregation_method = "Multi-Scale Concordant Blend"
        else:
            raw_prob = avg_signal
            aggregation_method = "Multi-Scale Natural Concordance"

        calibrated_prob = max(0.01, min(0.99, float(raw_prob)))
        deepfake_probability = round(calibrated_prob, 4)

        # 6. Three-Way Classification Verdict
        if deepfake_probability >= 0.96:
            prediction = "Likely AI Generated"
            raw_conf = deepfake_probability
        elif deepfake_probability <= 0.50:
            prediction = "Likely Natural"
            raw_conf = 1.0 - deepfake_probability
        else:
            prediction = "Uncertain"
            raw_conf = max(deepfake_probability, 1.0 - deepfake_probability)

        confidence = round(max(0.50, min(0.99, float(raw_conf))), 4)

        # 8. Detailed Diagnostic Logging
        print(f"\n[Image AI Engine Diagnostic]")
        print(f"  Image Specimen            : {w}x{h}")
        print(f"  whole_image_probability   : {round(full_image_fake_prob, 4)}")
        print(f"  center_patch_probability  : {round(center_fake_prob, 4)}")
        print(f"  each face_probability     : {[round(p, 4) for p in face_fake_probs] if face_fake_probs else 'None'}")
        print(f"  face count                : {faces_detected} (valid crops: {valid_faces})")
        print(f"  face aggregation method   : {aggregation_method}")
        print(f"  final probability         : {deepfake_probability}")
        print(f"  final classification      : {prediction} (Confidence: {confidence})\n")

        # 9. Explanation Generation
        explanation = self._generate_explanation(
            deepfake_probability,
            prediction,
            faces_detected,
            image_quality,
            face_results
        )

        return {
            "prediction": prediction,
            "confidence": confidence,
            "deepfakeProbability": deepfake_probability,
            "facesDetected": faces_detected,
            "validFaces": valid_faces,
            "faceResults": face_results,
            "analyzedPatches": analyzed_patches,
            "imageQuality": image_quality,
            "explanation": explanation,
            "modelVersion": "xRayon-ConvNeXtV2-Phase2",
            "analysisType": "AI-generated image detection"
        }

    def predict_image_bytes(
        self,
        image_bytes: bytes,
        filename: str = "image.jpg"
    ) -> Dict[str, Any]:
        """
        Decodes raw multipart image bytes (JPG, JPEG, PNG, WEBP) and evaluates specimen.
        """
        if not image_bytes:
            raise ValueError("Empty image file specimen uploaded.")

        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError(f"Unable to decode image specimen: {filename}")

        return self.analyze_image(image)


# Alias for backward compatibility
EfficientNetImageInferenceEngine = ImageAIDetectorEngine
