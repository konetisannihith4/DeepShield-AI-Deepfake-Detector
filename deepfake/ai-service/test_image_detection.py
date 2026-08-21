"""
Dedicated AI Image Detection Automated Test Suite

Tests:
1. Real photograph specimen (uploads/test.jpg.jpg)
2. AI-generated / synthetic image specimen
3. Non-face landscape specimen
4. Low-quality blurry image specimen
"""

import os
import cv2
import numpy as np
from image_ai_detector import ImageAIDetectorEngine


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
        img[y, :, 0] = int(255 * (y / h))
        img[y, :, 1] = int(200 * (1 - y / h))
        img[y, :, 2] = 50
    return img


def create_low_quality_blurry_specimen() -> np.ndarray:
    """Generates a heavily blurred low-quality image."""
    base = create_no_face_specimen()
    blurry = cv2.GaussianBlur(base, (35, 35), 0)
    return blurry


def run_tests():
    print("====================================================")
    print("Running Dedicated AI Image Detection Test Suite")
    print("====================================================\n")

    engine = ImageAIDetectorEngine()

    test_cases = []

    # 1. Real Image Specimen (test.jpg.jpg)
    real_path = os.path.join("uploads", "test.jpg.jpg")
    if os.path.exists(real_path):
        real_img = cv2.imread(real_path)
        test_cases.append(("test.jpg.jpg (Real Photo Specimen)", real_img))
    else:
        dummy_real = create_synthetic_ai_specimen()
        test_cases.append(("synthetic_real.jpg", dummy_real))

    # 2. AI-Generated / Synthetic Photo Specimen
    ai_img = create_synthetic_ai_specimen()
    test_cases.append(("synthetic_ai.jpg (AI Generated Pattern)", ai_img))

    # 3. Non-Face Landscape Specimen
    noface_img = create_no_face_specimen()
    test_cases.append(("landscape_noface.jpg (Non-Face Gradient)", noface_img))

    # 4. Low-Quality Blurry Specimen
    blurry_img = create_low_quality_blurry_specimen()
    test_cases.append(("blurry_specimen.jpg (Low Quality Blur)", blurry_img))

    print("\n--- EXECUTING IMAGE DETECTION TESTS ---\n")

    for filename, img in test_cases:
        print(f"File Specimen      : {filename}")
        result = engine.analyze_image(img)

        # Assert response schema requirements
        assert "prediction" in result, "Missing prediction"
        assert "confidence" in result, "Missing confidence"
        assert "deepfakeProbability" in result, "Missing deepfakeProbability"
        assert "facesDetected" in result, "Missing facesDetected"
        assert "validFaces" in result, "Missing validFaces"
        assert "faceResults" in result, "Missing faceResults"
        assert "imageQuality" in result, "Missing imageQuality"
        assert "explanation" in result, "Missing explanation"
        assert "modelVersion" in result, "Missing modelVersion"
        assert "analysisType" in result, "Missing analysisType"

        # Assert allowed categorical prediction
        assert result["prediction"] in ["Likely Natural", "Likely AI Generated", "Uncertain"], \
            f"Invalid prediction verdict: {result['prediction']}"

        # Assert numeric ranges
        assert 0.0 <= result["deepfakeProbability"] <= 1.0, "deepfakeProbability out of bounds [0, 1]"
        assert 0.50 <= result["confidence"] <= 1.0, "confidence out of bounds [0.50, 1.0]"

        print(f"  Prediction       : {result['prediction']}")
        print(f"  Confidence       : {result['confidence']}")
        print(f"  AI Probability   : {result['deepfakeProbability']}")
        print(f"  Faces Detected   : {result['facesDetected']}")
        print(f"  Model Version    : {result['modelVersion']}")
        print(f"  Analysis Type    : {result['analysisType']}")
        print(f"  Explanations     : {result['explanation']}")
        print("  [STATUS]: PASSED\n")

    print("====================================================")
    print("ALL DEDICATED IMAGE DETECTOR TESTS PASSED SUCCESSFULLY!")
    print("====================================================\n")


if __name__ == "__main__":
    run_tests()
