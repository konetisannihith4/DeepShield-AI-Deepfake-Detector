"""
Production Deepfake Video Detection Engine using Pretrained DFDC EfficientNet-B7 Ensemble.

Pretrained Model: DFDC 1st-Place EfficientNet-B7 (final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_40)
Architecture: DeepFakeClassifier (EfficientNet-B7)
Preprocessing: MTCNN Face Detection (30% margin), 380x380 RGB, ImageNet Normalization
Device Support: CUDA GPU with CPU Fallback
"""

import os
import time
import tempfile
from efficientnet_video_inference import EfficientNetVideoInferenceEngine


class LocalVideoDeepfakeDetector:
    _instance = None

    def __init__(self):
        print("[Video AI Service]: Migrated to DFDC EfficientNet-B7 Ensemble Engine.")
        self.engine = EfficientNetVideoInferenceEngine()
        self.is_ready = True

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LocalVideoDeepfakeDetector()
        return cls._instance

    def predict_video(self, video_bytes: bytes, filename: str = "specimen.mp4") -> dict:
        if not self.is_ready or self.engine is None:
            raise RuntimeError("EfficientNet-B7 video model is not ready.")

        print("\n-------------------------------------------------")
        print("[Video Detection]")
        print("Using Engine:")
        print("EfficientNetVideoInferenceEngine")
        print("\nCheckpoint:")
        if hasattr(self.engine, "model_detector") and hasattr(self.engine.model_detector, "checkpoint_paths"):
            for cpath in self.engine.model_detector.checkpoint_paths:
                print(os.path.basename(cpath))
        else:
            print("final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_40")
        print("-------------------------------------------------\n")

        ext = os.path.splitext(filename)[1] or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            res = self.engine.analyze_video(tmp_path)

            pred_text = res.get("prediction", "Natural")
            conf = float(res.get("confidence", 0.0))
            fake_prob = float(res.get("deepfakeProbability", 0.0))

            proc_time_sec = res.get("processing_time", 0.0)
            proc_time_str = f"{proc_time_sec}s" if isinstance(proc_time_sec, (int, float)) else str(proc_time_sec)

            # Threat level risk calculation
            if fake_prob >= 0.85:
                risk = "CRITICAL"
            elif fake_prob >= 0.70:
                risk = "HIGH"
            elif fake_prob >= 0.50:
                risk = "MEDIUM"
            else:
                risk = "LOW"

            frames_analyzed = res.get("frames_analyzed", 0)
            faces_detected = res.get("faces_detected", 0)

            return {
                "prediction": pred_text,
                "Prediction": pred_text,
                "confidence": round(conf, 4),
                "Confidence": round(conf, 4),
                "deepfakeProbability": round(fake_prob, 4),
                "risk": risk,
                "framesExtracted": frames_analyzed,
                "Frames Extracted": frames_analyzed,
                "validFramesUsed": frames_analyzed,
                "Valid Frames": frames_analyzed,
                "facesDetected": faces_detected,
                "Faces": faces_detected,
                "durationSeconds": res.get("durationSeconds", 0.0),
                "processingTime": proc_time_str,
                "Processing Time": proc_time_sec,
                "modelVersion": "DFDC EfficientNet-B7 Ensemble",
                "architecture": "DeepFakeClassifier (EfficientNet-B7)",
            }

        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
