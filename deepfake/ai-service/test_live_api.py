import requests
import os
import json

url = "http://127.0.0.1:8000/predict-image"
base_dir = os.path.dirname(os.path.abspath(__file__))
filepath = os.path.join(base_dir, "uploads", "real_camera_person.jpg")

print(f"Testing live API endpoint: {url} with specimen: {filepath}")

with open(filepath, "rb") as f:
    files = {"file": ("ai_boy_portrait1.png", f, "image/png")}
    response = requests.post(url, files=files)

print("HTTP Status Code:", response.status_code)
data = response.json()
print("Response JSON:")
print(json.dumps(data, indent=2))

required_fields = [
    "prediction", "confidence", "deepfakeProbability", "facesDetected",
    "validFaces", "analyzedPatches", "faceResults", "imageQuality",
    "explanation", "modelVersion", "analysisType"
]

missing = [field for field in required_fields if field not in data]
if not missing:
    print("\n[VERIFICATION OK] All 11 required API fields present!")
else:
    print("\n[VERIFICATION ERROR] Missing API fields:", missing)
