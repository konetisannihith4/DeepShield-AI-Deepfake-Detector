import os
from transformers import AutoImageProcessor, AutoModelForImageClassification

candidate_models = [
    "Falconsai/ai_vs_real_image_detection",
    "HemantK/ai_vs_real_image_detection",
    "nateraw/vit-base-patch16-224-in21k-fake-image-detector",
    "prithivMLmods/Deep-Fake-Detector-v2"
]

print("=" * 80)
print("TESTING CANDIDATE HF MODELS FOR WEIGHT VERIFICATION")
print("=" * 80)

for m_id in candidate_models:
    print(f"\nTesting model: {m_id}")
    try:
        proc = AutoImageProcessor.from_pretrained(m_id)
        model = AutoModelForImageClassification.from_pretrained(m_id)
        print(f"  [OK] Model successfully loaded: {m_id}")
        print(f"  [OK] Architecture: {model.__class__.__name__}")
        print(f"  [OK] id2label: {model.config.id2label}")
        print(f"  [OK] label2id: {model.config.label2id}")
    except Exception as e:
        print(f"  [ERR] Failed loading {m_id}: {e}")
