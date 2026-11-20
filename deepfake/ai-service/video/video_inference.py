"""
Video Detection Inference Engine (Phase 4 & 5 Verification & Debug Logging)
Orchestrates End-to-End Video Deepfake Detection with Detailed Per-Frame Diagnostics.
"""

import time
from typing import Dict, Any
import torch

from .config import VideoConfig
from .frame_extractor import FrameExtractor
from .face_detector import FaceDetector
from .video_preprocess import VideoPreprocessor
from .xception import XceptionDetector
from .aggregator import ScoreAggregator
from .utils import validate_video_file


class VideoInferenceEngine:
    """
    Main Video Deepfake Detection Pipeline Manager.
    Runs XceptionNet inference, per-frame debug printing, and weighted voting aggregation.
    Completely independent from Voice Detection module.
    """

    def __init__(self, config: VideoConfig = VideoConfig()):
        self.config = config
        self.frame_extractor = FrameExtractor(config)
        self.face_detector = FaceDetector(config)
        self.preprocessor = VideoPreprocessor(config)
        self.model_detector = XceptionDetector(config)
        self.aggregator = ScoreAggregator(config)

    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        """
        Executes end-to-end video deepfake detection pipeline with debug logging.

        Returns:
          - Prediction: 'Natural' | 'AI Generated' | 'No detectable face found.'
          - Confidence: float
          - Frames Extracted: int
          - Valid Frames: int
          - Faces: int
          - Processing Time: float (seconds)
        """
        start_time = time.perf_counter()

        if not validate_video_file(video_path, self.config):
            raise ValueError(f"Invalid or unsupported video file: {video_path}")

        print(f"\n==================================================")
        print(f"[Video Detection Pipeline]: Analyzing '{video_path}'...")

        # 1. Dynamic Frame Extraction
        extraction_res = self.frame_extractor.extract_frames(video_path)
        raw_frames = extraction_res["frames"]
        frames_extracted = extraction_res["frames_extracted"]
        duration_sec = extraction_res.get("duration_seconds", 0.0)

        if not raw_frames:
            print("[Video Detection Pipeline]: Zero readable frames extracted. Returning 'No detectable face found.'")
            elapsed_time = round(time.perf_counter() - start_time, 3)
            return {
                "Prediction": "No detectable face found.",
                "Confidence": 0.0,
                "Frames Extracted": 0,
                "Valid Frames": 0,
                "Faces": 0,
                "durationSeconds": duration_sec,
                "Processing Time": elapsed_time
            }

        # 2. Face Detection & Cropping (Ignore non-face frames!)
        detection_res = self.face_detector.detect_and_crop(raw_frames)
        face_crops = detection_res["face_crops"]
        faces_detected = detection_res["faces_detected"]
        valid_faces = detection_res["valid_faces"]

        if not face_crops or valid_faces == 0:
            print("[Video Detection Pipeline]: No valid faces detected in extracted frames. Returning 'No detectable face found.'")
            elapsed_time = round(time.perf_counter() - start_time, 3)
            return {
                "Prediction": "No detectable face found.",
                "Confidence": 0.0,
                "Frames Extracted": frames_extracted,
                "Valid Frames": 0,
                "Faces": 0,
                "durationSeconds": duration_sec,
                "Processing Time": elapsed_time
            }

        # 3. Preprocessing Face Crops into PyTorch Tensor Batch
        tensor_batch = self.preprocessor.preprocess_batch(face_crops)

        # 4. XceptionNet Inference with Per-Frame Diagnostics
        details = self.model_detector.predict_batch_with_details(tensor_batch)

        probabilities = []
        print("\n--- Per-Frame Inference Telemetry ---")
        for i, d in enumerate(details):
            frame_num = i + 1
            logit0, logit1 = d["raw_logits"]
            prob0, prob1 = d["probs"]
            pred_cls = d["pred_class"]
            conf = d["confidence"]

            print(f"Frame {frame_num}")
            print(f"Real Probability: {prob0:.4f}")
            print(f"Fake Probability: {prob1:.4f}")
            print(f"Raw logits: [{logit0:.4f}, {logit1:.4f}]")
            print(f"Softmax probabilities: [Real={prob0:.4f}, Fake={prob1:.4f}]")
            print(f"Predicted class index: {pred_cls} ({'AI Generated' if pred_cls == 1 else 'Natural'})")
            print(f"Confidence: {conf:.4f}\n")

            probabilities.append(prob1)

        # 5. Multi-Factor Weighted Voting Aggregation
        aggregation_res = self.aggregator.aggregate_weighted_voting(
            predictions=probabilities,
            face_crops=face_crops
        )

        final_prob = aggregation_res["Aggregated_Score"]
        prediction = aggregation_res["Prediction"]
        confidence = aggregation_res["Confidence"]

        print("--- Final Video Analysis Summary ---")
        print(f"Final Video Probability: {final_prob:.4f}")
        print(f"Final Prediction: {prediction}")
        print(f"Confidence: {confidence:.4f}")
        print("==================================================\n")

        elapsed_time = round(time.perf_counter() - start_time, 3)
        valid_frames_count = min(frames_extracted, valid_faces)

        return {
            "Prediction": prediction,
            "Confidence": confidence,
            "deepfakeProbability": final_prob,
            "risk": "CRITICAL" if final_prob >= 0.85 else ("HIGH" if final_prob >= 0.70 else ("MEDIUM" if final_prob >= 0.50 else "LOW")),
            "Frames Extracted": frames_extracted,
            "Valid Frames": valid_frames_count,
            "Faces": valid_faces,
            "durationSeconds": duration_sec,
            "Processing Time": elapsed_time
        }
