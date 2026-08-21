import os
import sys
from pathlib import Path

# Add current dir to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from inference import LocalAudioDeepfakeDetector

def test_inference():
    print("Testing Production Integrated Hybrid Engine...")
    detector = LocalAudioDeepfakeDetector.get_instance()
    
    debug_dir = Path(__file__).parent / "debug_wavs"
    debug_files = list(debug_dir.glob("*.wav"))
    
    if debug_files:
        test_file = debug_files[0]
        print(f"Running test inference on: {test_file.name}")
        with open(test_file, "rb") as f:
            data = f.read()
        res = detector.predict(data, filename=test_file.name)
        print("\nSUCCESS! Payload response received:")
        for k, v in res.items():
            print(f"  {k}: {v}")
    else:
        print("No debug WAV files found to test.")

if __name__ == "__main__":
    test_inference()
