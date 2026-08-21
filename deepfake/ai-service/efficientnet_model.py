"""
DeepFakeClassifier Architecture (EfficientNet-B7 Backbone)
Recreates original Kaggle DFDC 1st-Place DeepFakeClassifier architecture & Ensemble Manager.
Includes multi-checkpoint discovery from ai-service/weights/, strict key verification, and probability averaging.
"""

import os
import glob
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Any, Tuple
import numpy as np
import timm


class DeepFakeClassifier(nn.Module):
    """
    DeepFakeClassifier model using EfficientNet-B7 (tf_efficientnet_b7_ns) encoder.
    Outputs single logit for deepfake binary classification.
    """

    def __init__(self, encoder: str = "tf_efficientnet_b7_ns", num_classes: int = 1, drop_rate: float = 0.4):
        super(DeepFakeClassifier, self).__init__()
        self.encoder_name = encoder
        self.num_classes = num_classes

        # Initialize tf_efficientnet_b7_ns backbone via timm
        self.encoder = timm.create_model(encoder, pretrained=False)
        in_features = self.encoder.classifier.in_features

        # Classifier head
        self.dropout = nn.Dropout(drop_rate)
        self.fc = nn.Linear(in_features, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.encoder.forward_features(x)
        x = self.encoder.global_pool(x)
        x = self.dropout(x)
        out = self.fc(x)
        return out


def discover_weights(weights_dir: str = None) -> List[str]:
    """
    Discovers all EfficientNet DFDC checkpoint files inside ai-service/weights/.
    Raises RuntimeError if no checkpoints are found inside weights/.
    """
    if weights_dir is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        weights_dir = os.path.join(base_dir, "weights")

    os.makedirs(weights_dir, exist_ok=True)

    files = [
        os.path.join(weights_dir, f)
        for f in os.listdir(weights_dir)
        if os.path.isfile(os.path.join(weights_dir, f)) and not f.startswith(".")
    ]

    if not files:
        raise RuntimeError("No EfficientNet checkpoints found inside ai-service/weights/.")

    return sorted(files)


class EfficientNetEnsembleDetector:
    """
    Ensemble Model Loader & Inference Manager for EfficientNet-B7 DeepFakeClassifier checkpoints.
    Discovers all weights inside ai-service/weights/, loads each checkpoint, and performs ensemble averaging.
    """

    def __init__(self, weights_dir: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.checkpoint_paths = discover_weights(weights_dir)
        self.models: List[DeepFakeClassifier] = []

    def load_models(self) -> List[DeepFakeClassifier]:
        """
        Loads all discovered EfficientNet-B7 checkpoints into memory.
        Reports missing and unexpected keys for each checkpoint.
        """
        print(f"\n-------------------------------------------------------")
        print(f"[EfficientNet-B7] Found {len(self.checkpoint_paths)} checkpoint(s)")
        print(f"[EfficientNet-B7] Loading:")

        loaded_models = []

        for cpath in self.checkpoint_paths:
            fname = os.path.basename(cpath)
            abs_path = os.path.abspath(cpath)
            rel_path = os.path.relpath(cpath, start=os.path.dirname(os.path.abspath(__file__)))

            print(f"  Checkpoint Filename: {fname}")
            print(f"  Absolute Path: {abs_path}")

            net = DeepFakeClassifier(encoder="tf_efficientnet_b7_ns", num_classes=1)

            try:
                checkpoint = torch.load(cpath, map_location=self.device)
                state_dict = (
                    checkpoint["state_dict"]
                    if isinstance(checkpoint, dict) and "state_dict" in checkpoint
                    else checkpoint
                )
            except Exception as e:
                raise RuntimeError(f"CRITICAL ERROR: Failed to load checkpoint file '{abs_path}': {str(e)}")

            # Strip DataParallel 'module.' prefix if present
            cleaned_state_dict = {}
            for k, v in state_dict.items():
                new_k = k[7:] if k.startswith("module.") else k
                cleaned_state_dict[new_k] = v

            # Load state dict and verify missing/unexpected keys
            try:
                load_result = net.load_state_dict(cleaned_state_dict, strict=False)
                missing_keys = load_result.missing_keys
                unexpected_keys = load_result.unexpected_keys
            except Exception as e:
                raise RuntimeError(f"CRITICAL ERROR: Error loading state_dict for '{fname}': {str(e)}")

            print(f"  Missing Keys: {missing_keys}")
            print(f"  Unexpected Keys: {unexpected_keys}")

            if len(missing_keys) > 0 or len(unexpected_keys) > 0:
                raise RuntimeError(
                    f"CRITICAL ERROR: Checkpoint '{fname}' key verification failed. "
                    f"Missing: {missing_keys}, Unexpected: {unexpected_keys}"
                )

            net.eval()
            net.to(self.device)

            # Verification forward pass
            with torch.no_grad():
                dummy = torch.zeros(1, 3, 380, 380, device=self.device)
                out = net(dummy)
                if out.shape != (1, 1):
                    raise ValueError(f"Expected output shape (1, 1), got {out.shape}")

            loaded_models.append(net)

        self.models = loaded_models
        print("Model loaded successfully.")
        print(f"-------------------------------------------------------\n")
        return self.models

    def predict_batch(self, input_tensor: torch.Tensor) -> List[float]:
        """
        Runs batch forward pass across all loaded ensemble models and averages deepfake probabilities.
        """
        if not self.models:
            self.load_models()

        if input_tensor is None or input_tensor.shape[0] == 0:
            return []

        input_tensor = input_tensor.to(self.device)

        ensemble_probs = []
        with torch.no_grad():
            for model in self.models:
                logits = model(input_tensor)  # Shape (N, 1)
                probs = torch.sigmoid(logits.squeeze(1)).cpu().numpy()
                if probs.ndim == 0:
                    probs = np.array([float(probs)])
                ensemble_probs.append(probs)

        # Average probabilities across all models in ensemble
        avg_probs = np.mean(np.array(ensemble_probs), axis=0).tolist()
        return [float(p) for p in avg_probs]
