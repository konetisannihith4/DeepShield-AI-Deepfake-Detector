import requests
import os
import json

URL = "http://127.0.0.1:8000/predict-image"
TEST_IMG = r"C:\Users\konet\Downloads\Deepshield\deepfake\ai-service\uploads\real_camera_person.jpg"

def test_api_contract():
    print("=== TESTING FASTAPI /predict-image API RESPONSE CONTRACT ===")
    
    if not os.path.exists(TEST_IMG):
        # find any image in uploads or benchmark
        img_files = [f for f in os.listdir(r"C:\Users\konet\Downloads\Deepshield\deepfake\ai-service\uploads") if f.endswith(('.jpg', '.png'))]
        if img_files:
            img_path = os.path.join(r"C:\Users\konet\Downloads\Deepshield\deepfake\ai-service\uploads", img_files[0])
        else:
            raise FileNotFoundError("No test image found for API test.")
    else:
        img_path = TEST_IMG

    print(f"Uploading image: {img_path}")
    with open(img_path, "rb") as f:
        files = {"file": (os.path.basename(img_path), f, "image/jpeg")}
        resp = requests.post(URL, files=files)

    print(f"HTTP Status Code: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}: {resp.text}"

    data = resp.json()
    print("API Response Body:")
    print(json.dumps(data, indent=2))

    required_fields = [
        "prediction",
        "confidence",
        "deepfakeProbability",
        "facesDetected",
        "validFaces",
        "analyzedPatches",
        "faceResults",
        "imageQuality",
        "explanation",
        "modelVersion",
        "analysisType"
    ]

    missing = [field for field in required_fields if field not in data]
    print("\nField Validation:")
    for field in required_fields:
        present = field in data
        val = data.get(field)
        print(f"  - {field:<20}: {'PRESENT' if present else 'MISSING'} (Sample: {type(val).__name__})")

    assert not missing, f"Missing required API fields: {missing}"
    assert 0.0 <= data["deepfakeProbability"] <= 1.0, "deepfakeProbability out of bounds!"
    print("\n[SUCCESS] /predict-image API Contract Fully Verified!")

if __name__ == "__main__":
    test_api_contract()
