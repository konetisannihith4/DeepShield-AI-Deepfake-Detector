import os
import torch
import torch.nn.functional as F
import timm
import torchvision.transforms as transforms
from PIL import Image

def build_convnext_model():
    model = timm.create_model("convnextv2_base", pretrained=False, num_classes=2)
    return model

def get_test_transform():
    mean = (0.485, 0.456, 0.406)
    std = (0.229, 0.224, 0.225)
    return transforms.Compose([
        transforms.Resize(288),
        transforms.CenterCrop(256),
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])

def test_load():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ckpt_path = os.path.join(
        base_dir,
        "models",
        "xrayon_convnext",
        "AI Images Detector",
        "checkpoints",
        "checkpoint_phase2.pth"
    )

    print("=" * 80)
    print("VERIFYING xRayon ConvNeXtV2 Phase-2 MODEL LOADING")
    print("=" * 80)
    print(f"Device        : {device}")
    print(f"Checkpoint Path: {ckpt_path}")

    if not os.path.exists(ckpt_path):
        raise FileNotFoundError(f"Checkpoint file missing: {ckpt_path}")

    model = build_convnext_model()
    ckpt = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(ckpt["model"])
    model.to(device)
    model.eval()

    print("[OK] xRayon ConvNeXtV2 Phase-2 weights loaded successfully!")

    # Test forward pass on a dummy image
    dummy_img = Image.new("RGB", (512, 512), color=(100, 150, 200))
    transform = get_test_transform()
    img_tensor = transform(dummy_img).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(img_tensor)
        probs = F.softmax(logits, dim=1)[0]

    real_prob = probs[0].item()
    fake_prob = probs[1].item()

    print("\nDummy Forward Pass Results:")
    print(f"  Logits    : {logits.cpu().numpy()}")
    print(f"  Real Prob : {real_prob*100:.2f}% (Index 0)")
    print(f"  Fake Prob : {fake_prob*100:.2f}% (Index 1)")
    print("=" * 80)

if __name__ == "__main__":
    test_load()
