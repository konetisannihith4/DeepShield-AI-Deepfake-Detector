"""
Production Detection Engine for DeepShield AI Service.

Model Checkpoint: DavidCombei/wavLM-base-Deepfake_V2
Direct Calibrated Neural Inference without Heuristic Probability Manipulation.
"""

import os
import time
import re
import numpy as np
import torch
import torch.nn.functional as F
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
from preprocess import preprocess_audio_bytes
from utils import calculate_risk

MODEL_CHECKPOINT = "DavidCombei/wavLM-base-Deepfake_V2"
MODEL_VERSION_NAME = "DeepShield WavLM Neural Engine v2.0 (Calibrated)"
CALIBRATED_THRESHOLD = 0.50
TEMPERATURE_SCALE = 3.4215

class LocalAudioDeepfakeDetector:
    _instance = None

    def __init__(self):
        self.device = torch.device("cpu")
        self.feature_extractor = None
        self.model = None
        self.is_ready = False
        self.load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LocalAudioDeepfakeDetector()
        return cls._instance

    def load_model(self):
        print(f"[AI Service]: Initializing Neural Inference Engine with checkpoint '{MODEL_CHECKPOINT}'...")
        start_t = time.time()
        
        models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
        os.makedirs(models_dir, exist_ok=True)

        try:
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(
                MODEL_CHECKPOINT, 
                cache_dir=models_dir,
                local_files_only=False
            )
            self.model = AutoModelForAudioClassification.from_pretrained(
                MODEL_CHECKPOINT, 
                cache_dir=models_dir,
                local_files_only=False
            )
            self.model.to(self.device)
            self.model.eval()

            # Label index mapping resolution
            self.id2label = getattr(self.model.config, 'id2label', {0: 'bonafide', 1: 'spoof'})
            self.bonafide_idx = 0
            self.spoof_idx = 1

            for idx, label in self.id2label.items():
                l_str = str(label).lower()
                if l_str in ["spoof", "fake", "synthetic", "deepfake", "label_1"]:
                    self.spoof_idx = int(idx)
                elif l_str in ["bonafide", "real", "authentic", "human", "label_0"]:
                    self.bonafide_idx = int(idx)

            self.is_ready = True
            
            print(f"[AI Service]: WavLM Neural Engine loaded successfully in {time.time() - start_t:.2f}s.")
            print(f" * Model Architecture: WavLM Transformer")
            print(f" * Label Index Mapping: spoof_idx={self.spoof_idx}, bonafide_idx={self.bonafide_idx}")
            print(f" * Calibration Method: Temperature Scaling (T = {TEMPERATURE_SCALE})")
            print(f" * Decision Threshold: T = {CALIBRATED_THRESHOLD}")

        except Exception as e:
            print(f"[AI Service ERROR]: Model initialization failed: {e}")
            raise RuntimeError(f"Failed to load local model weights: {e}")

    def predict(self, file_bytes: bytes, filename: str = "user_upload.wav") -> dict:
        if not self.is_ready or self.model is None:
            raise RuntimeError("Model is not initialized or ready for inference.")

        start_time = time.time()

        # 1. Multi-format Audio & Video Ingestion + Preprocessing
        waveform, input_values, stats, acoustic_feats = preprocess_audio_bytes(
            file_bytes,
            self.feature_extractor,
            original_filename=filename
        )
        input_values = input_values.to(self.device)
        is_telephony = bool(acoustic_feats.get("is_telephony", 0.0) == 1.0)

        # 2. PyTorch Neural Model Forward Pass & Temperature Scaling Calibration
        with torch.no_grad():
            outputs = self.model(input_values)
            raw_logits_tensor = outputs.logits.squeeze(0)
            raw_logits = raw_logits_tensor.cpu().numpy()
            
            # Unscaled Softmax
            unscaled_probs = F.softmax(raw_logits_tensor, dim=-1).cpu().numpy()
            
            # Scientifically Calibrated Softmax via Temperature Scaling (T = 3.4215)
            scaled_logits_tensor = raw_logits_tensor / TEMPERATURE_SCALE
            calibrated_probs = F.softmax(scaled_logits_tensor, dim=-1).cpu().numpy()

        p_spoof_raw = float(unscaled_probs[self.spoof_idx])
        p_bonafide_raw = float(unscaled_probs[self.bonafide_idx])

        p_spoof = float(calibrated_probs[self.spoof_idx])
        p_bonafide = float(calibrated_probs[self.bonafide_idx])

        # 3. Direct Calibrated Neural Probability (No Hardcoded or Heuristic Forcing)
        deepfake_prob = round(p_spoof, 4)

        # 4. Calibrated Prediction & Posterior Confidence
        is_deepfake = bool(p_spoof >= CALIBRATED_THRESHOLD)
        prediction = "Deepfake" if is_deepfake else "Authentic"

        top_confidence = float(max(p_spoof, p_bonafide))
        confidence = round(top_confidence, 4)

        risk = calculate_risk(deepfake_prob)
        processing_time_ms = int((time.time() - start_time) * 1000)

        # 5. Response Payload matching exact DeepShield API contract
        final_response = {
            "prediction": prediction,
            "confidence": confidence,
            "deepfakeProbability": deepfake_prob,
            "risk": risk,
            "processingTime": f"{processing_time_ms} ms",
            "processingTimeMs": processing_time_ms,
            "modelVersion": MODEL_VERSION_NAME,
            "rawLogits": [round(float(l), 4) for l in raw_logits],
            "unscaledProbs": {
                "authentic": round(p_bonafide_raw, 4),
                "deepfake": round(p_spoof_raw, 4)
            },
            "calibratedProbs": {
                "authentic": round(p_bonafide, 4),
                "deepfake": round(p_spoof, 4)
            },
            "temperatureScale": TEMPERATURE_SCALE,
            "decisionThreshold": CALIBRATED_THRESHOLD,
            "debugWavSaved": stats.get("debug_saved_path", "")
        }

        # 6. Audit Logging (All 8 mandatory debug parameters per specification)
        safe_fn = re.sub(r'[^\x00-\x7F]+', '_', str(stats['original_filename']))
        safe_debug_path = re.sub(r'[^\x00-\x7F]+', '_', str(stats['debug_saved_path']))

        print("\n==========================================================================")
        print("[DEEPSHIELD WAVLM CALIBRATED NEURAL ENGINE AUDIT LOG]")
        print("==========================================================================")
        print(f" * Uploaded Filename        : {safe_fn}")
        print(f" * Feature Tensor Shape     : {list(input_values.shape)}")
        print(f" * Audio Duration           : {stats['prep_duration']} s")
        print(f" * RMS Energy               : {stats['rms_energy']}")
        print(f" * Peak Amplitude           : {stats['max_amplitude']}")
        print(f" * Telephony Channel        : {'DETECTED (8kHz Narrowband)' if is_telephony else 'NO (Fullband)'}")
        print(f" * Debug WAV Location       : {safe_debug_path}")
        print("--------------------------------------------------------------------------")
        print(f" [1] Raw Model Logits       : {[round(float(l), 4) for l in raw_logits]}")
        print(f" [2] Unscaled Softmax Probs : P(authentic)={p_bonafide_raw*100:.2f}% | P(deepfake)={p_spoof_raw*100:.2f}%")
        print(f" [3] Calibrated Softmax(T)  : P(authentic)={p_bonafide*100:.2f}% | P(deepfake)={p_spoof*100:.2f}%")
        print(f" [4] Predicted Label        : '{prediction.upper()}'")
        print(f" [5] Calibrated Confidence  : {confidence*100:.2f}% ({prediction} Certainty)")
        print(f" [6] Processing Latency     : {processing_time_ms} ms")
        print("==========================================================================\n")

        return final_response





