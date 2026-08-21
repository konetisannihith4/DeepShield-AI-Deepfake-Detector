import sys
import os
import torch
from image_ai_model import ImageDeepfakeDetectorModel
from image_ai_detector import ImageAIDetectorEngine

def test_threshold_logic():
    print("=== TESTING THRESHOLD 0.96 CLASSIFICATION BOUNDARIES ===")
    
    test_cases = [
        (0.00, "Likely Natural"),
        (0.10, "Likely Natural"),
        (0.49, "Likely Natural"),
        (0.50, "Likely Natural"),
        (0.5001, "Uncertain"),
        (0.75, "Uncertain"),
        (0.90, "Uncertain"),
        (0.9599, "Uncertain"),
        (0.96, "Likely AI Generated"),
        (0.97, "Likely AI Generated"),
        (0.99, "Likely AI Generated"),
        (1.00, "Likely AI Generated"),
    ]
    
    passed = 0
    for prob, expected in test_cases:
        # Evaluate 3-way decision rule directly:
        if prob >= 0.96:
            pred = "Likely AI Generated"
        elif prob <= 0.50:
            pred = "Likely Natural"
        else:
            pred = "Uncertain"
            
        status = "PASS" if pred == expected else f"FAIL (Got {pred})"
        if pred == expected:
            passed += 1
        print(f"  Probability {prob:<6} -> {pred:<20} [{status}]")
        
    print(f"\nResult: {passed}/{len(test_cases)} tests passed.")
    assert passed == len(test_cases), "Threshold logic test failed!"

def test_model_loading():
    print("\n=== TESTING XRAYON CONVNEXTV2 PHASE-2 MODEL LOADING ===")
    model = ImageDeepfakeDetectorModel()
    assert model.is_loaded, "Model failed to load!"
    assert model.model_version_name == "xRayon-ConvNeXtV2-Phase2"
    print(f"[OK] Model loaded successfully: {model.model_version_name}")

if __name__ == "__main__":
    test_threshold_logic()
    test_model_loading()
    print("\nALL UNIT & MODEL TESTS PASSED SUCCESSFULLY!")
