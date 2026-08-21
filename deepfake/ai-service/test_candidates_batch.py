import os
from transformers import AutoImageProcessor, AutoModelForImageClassification

candidate_ids = [
    "ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL",
    "mmanikanta/ConvNeXT_AI_image_detector",
    "dima806/ai_vs_human_generated_image_detection",
    "capcheck/ai-image-detection",
    "mmanikanta/ResNet_AI_image_detector"
]

print("=" * 80)
print("VERIFYING CANDIDATE MODEL WEIGHTS & METADATA")
print("=" * 80)

for m_id in candidate_ids:
    print(f"\n--- Checking: {m_id} ---")
    try:
        proc = AutoImageProcessor.from_pretrained(m_id)
        model = AutoModelForImageClassification.from_pretrained(m_id)
        print(f"  Status       : SUCCESS")
        print(f"  Architecture : {model.__class__.__name__}")
        print(f"  id2label     : {model.config.id2label}")
        print(f"  label2id     : {model.config.label2id}")
    except Exception as e:
        print(f"  Status       : FAILED ({e})")
