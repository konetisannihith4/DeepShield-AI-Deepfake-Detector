"""
Inference Pipeline Debugging Script.

Traces complete pipeline for 5 different audio files:
- Real human voice (Abhinav friend recording)
- Phone recording
- ElevenLabs voice
- ChatGPT Voice
- Google TTS voice
"""

import sys
import os
from pathlib import Path

# Add current dir to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from inference import LocalAudioDeepfakeDetector

TEST_FILES = [
    ("Real Human Voice", Path("c:/Deepshield/deepfake/ai-service/debug_wavs/debug_1785608502_Abhinav_frnd_Tsms_2025-10-14_17-07-10.m4a.wav")),
    ("Phone Recording", Path("c:/Deepshield/training/real_world_test/real/phone_calls/phone_call_sample_01.wav")),
    ("ElevenLabs Voice", Path("c:/Deepshield/training/real_world_test/ai/elevenlabs/elevenlabs_adam_clone_01.wav")),
    ("ChatGPT Voice", Path("c:/Deepshield/training/real_world_test/ai/chatgpt_voice/chatgpt_voice_breeze_01.wav")),
    ("Google TTS Voice", Path("c:/Deepshield/training/real_world_test/ai/google_tts/google_wavenet_en_01.wav")),
]

def debug_pipeline():
    print("==========================================================================")
    print("         DEEPSHIELD INFERENCE PIPELINE END-TO-END DEBUGGER")
    print("==========================================================================")

    detector = LocalAudioDeepfakeDetector.get_instance()

    results = []

    for name, filepath in TEST_FILES:
        if not filepath.exists():
            print(f"Warning: File {filepath} not found.")
            continue

        with open(filepath, "rb") as f:
            file_bytes = f.read()

        res = detector.predict(file_bytes, filename=filepath.name)

        results.append({
            "name": name,
            "filename": filepath.name,
            "prediction": res["prediction"],
            "confidence": res["confidence"],
            "deepfakeProbability": res["deepfakeProbability"],
            "risk": res["risk"],
            "processingTime": res["processingTime"],
        })

    print("\n" + "="*85)
    print(f"{'Specimen Name':<20} | {'Prediction':<12} | {'Confidence':<12} | {'Deepfake Prob':<15} | {'Risk':<10}")
    print("-" * 85)
    for r in results:
        print(f"{r['name']:<20} | {r['prediction']:<12} | {r['confidence']:<12} | {r['deepfakeProbability']:<15} | {r['risk']:<10}")
    print("="*85 + "\n")

if __name__ == "__main__":
    debug_pipeline()
