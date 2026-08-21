from huggingface_hub import HfApi

api = HfApi()

print("Searching Hugging Face Hub for public image classification models...")
models = list(api.list_models(
    search="image", 
    filter="image-classification", 
    sort="downloads", 
    direction=-1, 
    limit=100
))

keywords = ["ai", "fake", "deepfake", "synthetic", "real", "generated"]

found = []
for m in models:
    name_lower = m.modelId.lower()
    if any(k in name_lower for k in ["ai-vs", "ai_vs", "deepfake", "fake-image", "ai-image", "ai_image", "synthetic"]):
        found.append(m.modelId)

print(f"Found {len(found)} candidate models on HF Hub:")
for f in found[:20]:
    print(f"  - {f}")
