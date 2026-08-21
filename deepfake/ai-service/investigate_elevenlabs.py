"""
Urgent Bug Investigation Script for ElevenLabs Low Confidence Issue.

Traces exact values for ElevenLabs file:
- raw logits
- softmax probabilities
- neural score
- acoustic feature score
- is_telephony flag
- hybrid score
- threshold
- prediction
- confidence
"""

import sys
import os
from pathlib import Path

# Add current dir to sys.path
sys.path.insert(0, str(Path(__file__).parent))

import numpy as np
import torch
import torch.nn.functional as F
from inference import LocalAudioDeepfakeDetector
from preprocess import preprocess_audio_bytes

DEBUG_DIR = Path(__file__).parent / "debug_wavs"

def investigate():
    print("==========================================================================")
    print("       ELEVENLABS DEEPSHIELD INFERENCE PIPELINE BUG INVESTIGATION")
    print("==========================================================================")

    # Find ElevenLabs files
    eleven_files = list(DEBUG_DIR.glob("*ElevenLabs*")) + list(Path("c:/Deepshield/training/real_world_test/ai/elevenlabs").glob("*.wav"))
    
    if not eleven_files:
        print("No ElevenLabs files found to test.")
        return

    detector = LocalAudioDeepfakeDetector.get_instance()

    for filepath in eleven_files[:5]:
        print("\n" + "="*80)
        print(f"File: {filepath.name}")
        print("="*80)

        with open(filepath, "rb") as f:
            file_bytes = f.read()

        waveform, input_values, stats, feats = preprocess_audio_bytes(
            file_bytes,
            detector.feature_extractor,
            original_filename=filepath.name
        )

        with torch.no_grad():
            outputs = detector.model(input_values.to(detector.device))
            raw_logits = outputs.logits.squeeze(0).cpu().numpy()
            scaled_logits = torch.from_numpy(raw_logits / 3.0)
            probs = F.softmax(scaled_logits, dim=-1).numpy()
            raw_probs = F.softmax(outputs.logits.squeeze(0), dim=-1).numpy()

        p_bonafide_raw = float(raw_probs[0])
        p_spoof_raw = float(raw_probs[1])

        p_bonafide_scaled = float(probs[0])
        p_spoof_scaled = float(probs[1])

        is_telephony = bool(feats.get("is_telephony", 0.0) == 1.0)

        pitch_std = float(feats.get("pitch_f0_std", 0.0))
        hnr_db = float(feats.get("hnr_db", 15.0))
        zcr_mean = float(feats.get("zero_crossing_rate_mean", 0.05))

        if is_telephony:
            p_pitch_syn = 1.0 / (1.0 + np.exp(0.6 * (pitch_std - 3.0)))
            p_hnr_syn = 1.0 / (1.0 + np.exp(-0.20 * (hnr_db - 22.0)))
            p_zcr_syn = 1.0 / (1.0 + np.exp(30.0 * (zcr_mean - 0.08)))
            ac_score = float(0.45 * p_pitch_syn + 0.35 * p_hnr_syn + 0.20 * p_zcr_syn)
            hybrid_score = float(0.20 * p_spoof_scaled + 0.80 * ac_score)
        else:
            p_pitch_syn = 1.0 / (1.0 + np.exp(0.4 * (pitch_std - 8.0)))
            p_hnr_syn = 1.0 / (1.0 + np.exp(-0.25 * (hnr_db - 20.0)))
            p_zcr_syn = 1.0 / (1.0 + np.exp(50.0 * (zcr_mean - 0.05)))
            ac_score = float(0.45 * p_pitch_syn + 0.35 * p_hnr_syn + 0.20 * p_zcr_syn)
            hybrid_score = float(0.40 * p_spoof_scaled + 0.60 * ac_score)

        print(f" * Raw PyTorch Logits        : {raw_logits.tolist()}")
        print(f" * Unscaled Softmax Probs   : P(bonafide)={p_bonafide_raw*100:.2f}% | P(spoof)={p_spoof_raw*100:.4f}%")
        print(f" * Scaled Softmax (T=3.0)   : P(bonafide)={p_bonafide_scaled*100:.2f}% | P(spoof)={p_spoof_scaled*100:.2f}%")
        print(f" * Telephony Detection      : {is_telephony} (orig_sr={stats['original_sample_rate']} Hz)")
        print(f" * Acoustic Pitch Std       : {pitch_std:.2f} Hz -> P_pitch(syn) = {p_pitch_syn*100:.2f}%")
        print(f" * Acoustic HNR             : {hnr_db:.2f} dB  -> P_hnr(syn)   = {p_hnr_syn*100:.2f}%")
        print(f" * Acoustic ZCR             : {zcr_mean:.5f}   -> P_zcr(syn)   = {p_zcr_syn*100:.2f}%")
        print(f" * Combined Acoustic Score  : S_acoustic = {ac_score*100:.2f}%")
        print(f" * Hybrid Risk Score        : S_hybrid   = {hybrid_score*100:.2f}%")
        print(f" * Fixed Threshold T        : T          = 0.69")
        print(f" * Final Verdict            : {'DEEPFAKE' if hybrid_score >= 0.69 else 'AUTHENTIC'}")

if __name__ == "__main__":
    investigate()
