"""
Weighted Voting Score Aggregator Module (Phase 4)
Aggregates per-face predictions using multi-factor weighted voting based on:
1. Face Detection Confidence
2. Face Sharpness (Laplacian variance)
3. Face Size (crop pixel area)
4. Prediction Confidence (distance from decision boundary)

Do NOT use simple averaging.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from .config import VideoConfig


class ScoreAggregator:
    """
    Weighted voting score aggregator for multi-face / multi-frame deepfake detection.
    """

    def __init__(self, config: VideoConfig = VideoConfig()):
        self.config = config

    def _compute_sharpness_weight(self, crop_bgr: np.ndarray) -> float:
        """Computes sharpness weight from Laplacian variance of face crop."""
        if crop_bgr is None or crop_bgr.size == 0:
            return 0.1
        gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
        var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        # Normalize sharpness score (cap at 300.0)
        return min(1.0, max(0.1, var / 300.0))

    def _compute_size_weight(self, crop_bgr: np.ndarray) -> float:
        """Computes face size weight based on crop area relative to target 299x299 resolution."""
        if crop_bgr is None or crop_bgr.size == 0:
            return 0.1
        h, w = crop_bgr.shape[:2]
        area = h * w
        target_area = 299 * 299
        return min(1.0, max(0.1, area / target_area))

    def aggregate_weighted_voting(
        self,
        predictions: List[float],
        face_crops: List[np.ndarray],
        det_confidences: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Aggregates per-face predictions using weighted voting strategy.

        Returns:
          - Prediction: 'Natural' or 'AI Generated'
          - Confidence: float (overall confidence score [0.0 - 1.0])
          - Aggregated_Score: float (weighted deepfake probability)
          - Details: List of individual face weights and predictions
        """
        if not predictions or not face_crops or len(predictions) != len(face_crops):
            return {
                "Prediction": "No detectable face found.",
                "Confidence": 0.0,
                "Aggregated_Score": 0.0,
                "Valid_Faces": 0
            }

        if det_confidences is None:
            det_confidences = [1.0] * len(predictions)

        weighted_score_sum = 0.0
        total_weight_sum = 0.0
        face_details = []

        for idx, (prob, crop, det_conf) in enumerate(zip(predictions, face_crops, det_confidences)):
            # 1. Face Detection Confidence Weight
            w_det = max(0.1, float(det_conf))

            # 2. Face Sharpness Weight
            w_sharp = self._compute_sharpness_weight(crop)

            # 3. Face Size Weight
            w_size = self._compute_size_weight(crop)

            # 4. Prediction Confidence Weight (|p - 0.5| * 2)
            pred_certainty = abs(prob - 0.5) * 2.0
            w_pred = max(0.1, float(pred_certainty))

            # Combined Multi-Factor Weight
            weight = w_det * w_sharp * w_size * w_pred
            
            weighted_score_sum += weight * prob
            total_weight_sum += weight

            face_details.append({
                "face_idx": idx,
                "deepfake_probability": prob,
                "weights": {
                    "w_detection": w_det,
                    "w_sharpness": w_sharp,
                    "w_size": w_size,
                    "w_pred_confidence": w_pred,
                    "final_weight": weight
                }
            })

        if total_weight_sum <= 0:
            aggregated_prob = float(np.mean(predictions))
        else:
            aggregated_prob = float(weighted_score_sum / total_weight_sum)

        # Classification decision
        prediction = "AI Generated" if aggregated_prob >= 0.5 else "Natural"
        
        # Overall confidence score
        confidence = float(max(aggregated_prob, 1.0 - aggregated_prob))

        return {
            "Prediction": prediction,
            "Confidence": round(confidence, 4),
            "Aggregated_Score": round(aggregated_prob, 4),
            "Valid_Faces": len(predictions),
            "Face_Details": face_details
        }
