"""
EfficientNet-B7 Video Detection Inference Engine
Orchestrates Video -> MTCNN Face Detection (30% margin) -> 380x380 ImageNet Preprocessing -> DeepFakeClassifier Ensemble Inference -> Score Aggregation.
Includes auto-discovery of DFDC weights in ai-service/weights/ and strict verification during startup.
"""

import os
import time
import tempfile
import cv2
import numpy as np
import torch
from typing import Dict, Any, List

from efficientnet_model import EfficientNetEnsembleDetector, discover_weights
from efficientnet_preprocessing import EfficientNetPreprocessor
from video.face_detector import FaceDetector
from video.aggregator import ScoreAggregator


class EfficientNetVideoInferenceEngine:
    """
    Independent Video Deepfake Detector using EfficientNet-B7 DeepFakeClassifier Ensemble.
    Automatically discovers all pretrained checkpoints inside ai-service/weights/ and logs startup verification.
    """

    def __init__(self, weights_dir: str = None):
        self.preprocessor = EfficientNetPreprocessor(target_size=(380, 380), margin_ratio=0.30)
        self.face_detector = FaceDetector()
        self.model_detector = EfficientNetEnsembleDetector(weights_dir=weights_dir)
        self.aggregator = ScoreAggregator()

        # Pre-initialize and strictly load checkpoints during engine startup
        self.model_detector.load_models()

    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        start_t = time.perf_counter()

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to read video stream: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        duration_sec = total_frames / fps if total_frames > 0 else 0.0

        if total_frames <= 0:
            cap.release()
            return {
                "prediction": "No detectable face found.",
                "confidence": 0.0,
                "processing_time": 0.0,
                "frames_analyzed": 0,
                "faces_detected": 0
            }

        # Sample frames across video timeline
        sample_count = min(30, max(10, int(total_frames / 10)))
        frame_indices = np.linspace(0, max(0, total_frames - 1), num=sample_count, dtype=int)

        face_crops = []
        frames_analyzed = 0

        for f_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
            ret, frame_bgr = cap.read()
            if not ret or frame_bgr is None:
                continue

            frames_analyzed += 1
            det_res = self.face_detector.detect_and_crop([frame_bgr])
            crops = det_res["face_crops"]

            for crop in crops:
                face_crops.append(crop)

        cap.release()

        faces_detected = len(face_crops)

        if not face_crops:
            proc_time = round(time.perf_counter() - start_t, 3)
            return {
                "prediction": "No detectable face found.",
                "confidence": 0.0,
                "processing_time": proc_time,
                "frames_analyzed": frames_analyzed,
                "faces_detected": 0
            }

        # Preprocess face crops into (N, 3, 380, 380) tensor
        tensor_batch = self.preprocessor.preprocess_batch(face_crops)

        # Predict batch using EfficientNet-B7 DeepFakeClassifier Ensemble
        fake_probabilities = self.model_detector.predict_batch(tensor_batch)

        # Weighted Voting Aggregation
        agg_res = self.aggregator.aggregate_weighted_voting(fake_probabilities, face_crops)

        proc_time = round(time.perf_counter() - start_t, 3)

        return {
            "prediction": agg_res["Prediction"],
            "confidence": agg_res["Confidence"],
            "deepfakeProbability": agg_res["Aggregated_Score"],
            "processing_time": proc_time,
            "frames_analyzed": frames_analyzed,
            "faces_detected": faces_detected,
            "durationSeconds": round(duration_sec, 2),
            "modelVersion": f"EfficientNet-B7 Ensemble ({len(self.model_detector.models)} checkpoints)"
        }

    def predict_video_bytes(self, video_bytes: bytes, filename: str = "specimen.mp4") -> Dict[str, Any]:
        ext = os.path.splitext(filename)[1] or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            return self.analyze_video(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
