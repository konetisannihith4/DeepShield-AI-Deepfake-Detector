"""
Comprehensive Test Suite for Image AI-Generation Detector Engine
Tests:
1. Real photo specimen (uploads/test.jpg.jpg or natural photo)
2. AI-generated image specimen
3. Non-face image specimen (landscape / abstract gradient)
4. Low-quality blurry image specimen
"""

import os
import cv2
import numpy as np
from efficientnet_image_inference import EfficientNetImageInferenceEngine


def create_synthetic_ai_specimen() -> np.ndarray:
    """Generates a synthetic test image with high-frequency AI-like noise and patterns."""
    h, w = 380, 380
    img = np.zeros((h, w, 3), dtype=np.uint8)
    cv2.circle(img, (190, 190), 100, (180, 200, 255), -1)
    cv2.ellipse(img, (190, 200), (60, 40), 0, 0, 360, (120, 150, 220), -1)
    noise = np.random.randint(0, 50, (h, w, 3), dtype=np.uint8)
    return cv2.add(img, noise)


def create_no_face_specimen() -> np.ndarray:
    """Generates a non-face landscape/gradient image."""
    h, w = 400, 400
    img = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        img[y, :, 0] = int(255 * (y / h))  # Blue gradient
        img[y, :, 1] = int(200 * (1 - y / h))  # Green gradient
        img[y, :, 2] = 50
    return img


def create_low_quality_blurry_specimen() -> np.ndarray:
    """Generates a heavily blurred low-quality image."""
    base = create_no_face_specimen()
    blurry = cv2.GaussianBlur(base, (35, 35), 0)
    return blurry


def run_tests():
    print("====================================================")
    print("Running Image AI-Generation Detector Automated Tests")
    print("====================================================\n")

    engine = EfficientNetImageInferenceEngine()

    test_cases = []

    # 1. Real Image Specimen (if test.jpg.jpg exists)
    real_path = os.path.join("uploads", "test.jpg.jpg")
    if os.path.exists(real_path):
        real_img = cv2.imread(real_path)
        test_cases.append(("Test Case 1: Real Image Specimen (test.jpg.jpg)", real_img))
    else:
        dummy_real = create_synthetic_ai_specimen()
        test_cases.append(("Test Case 1: Synthetic Specimen", dummy_real))

    # 2. AI-Generated Specimen
    ai_img = create_synthetic_ai_specimen()
    test_cases.append(("Test Case 2: AI-Generated / Synthetic Specimen", ai_img))

    # 3. No-Face Image Specimen
    noface_img = create_no_face_specimen()
    test_cases.append(("Test Case 3: Non-Face Image Specimen (Landscape Gradient)", noface_img))

    # 4. Low-Quality Blurry Image Specimen
    blurry_img = create_low_quality_blurry_specimen()
    test_cases.append(("Test Case 4: Low-Quality Blurry Image Specimen", blurry_img))

    print("\n--- EXECUTING TEST SUITE ---\n")

    for title, img in test_cases:
        print(f">>> {title}")
        result = engine.analyze_image(img)

        # Assert all required keys in response format
        assert "prediction" in result, "Missing prediction in response"
        assert "confidence" in result, "Missing confidence in response"
        assert "deepfakeProbability" in result, "Missing deepfakeProbability in response"
        assert "facesDetected" in result, "Missing facesDetected in response"
        assert "validFaces" in result, "Missing validFaces in response"
        assert "faceResults" in result, "Missing faceResults in response"
        assert "imageQuality" in result, "Missing imageQuality in response"
        assert "sharpness" in result["imageQuality"], "Missing sharpness in imageQuality"
        assert "brightness" in result["imageQuality"], "Missing brightness in imageQuality"
        assert "contrast" in result["imageQuality"], "Missing contrast in imageQuality"
        assert "explanation" in result, "Missing explanation in response"
        assert "modelVersion" in result, "Missing modelVersion in response"
        assert "analysisType" in result, "Missing analysisType in response"

        # Assert valid prediction values
        assert result["prediction"] in ["Likely Natural", "Likely AI Generated", "Uncertain"], f"Invalid prediction: {result['prediction']}"

        # Assert probability and confidence bounds
        assert 0.0 <= result["deepfakeProbability"] <= 1.0, "deepfakeProbability out of range [0, 1]"
        assert 0.50 <= result["confidence"] <= 1.0, "confidence out of range [0.50, 1.0]"

        print(f"    Result Prediction : {result['prediction']}")
        print(f"    Confidence        : {result['confidence']}")
        print(f"    Probability       : {result['deepfakeProbability']}")
        print(f"    Faces Detected    : {result['facesDetected']}")
        print(f"    Analysis Type     : {result['analysisType']}")
        print(f"    Explanation Count : {len(result['explanation'])}")
        print("    [STATUS]: PASSED\n")

    print("====================================================")
    print("ALL 4 IMAGE DETECTOR TEST CASES PASSED SUCCESSFULLY!")
    print("====================================================\n")


if __name__ == "__main__":
    run_tests()
