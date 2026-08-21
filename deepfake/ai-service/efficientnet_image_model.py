"""
Dedicated Image AI-Generation Model Manager

Independent module for AI-generated image detection.
Separated from video-dedicated efficientnet_model.py to prevent any side effects on video inference.

Uses Vision Transformer (ViT-Base) fine-tuned for deepfake vs real image classification:
- Model: dima806/deepfake_vs_real_image_detection
- Supports full-canvas global evaluation and cropped face-patch evaluation
"""

import os
import torch
import torch.nn as nn
from PIL import Image
import numpy as np
import cv2
from typing import Dict, Any, List, Optional, Tuple
from transformers import ViTForImageClassification, AutoImageProcessor


class ImageDeepfakeDetectorModel:
    """
    Dedicated model loader and classifier for AI-generated images.
    Loads local cached ViT model or falls back to HuggingFace repository.
    """

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.vit_model: Optional[ViTForImageClassification] = None
        self.vit_processor: Optional[AutoImageProcessor] = None
        self.is_loaded = False
        self._load_model()

    def _get_snapshot_path(self) -> str:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        snapshot_path = os.path.join(
            base_dir,
            "models",
            "models--dima806--deepfake_vs_real_image_detection",
            "snapshots",
            "29e4cf9efc543845610045f6ba7e88e5cf9d9301"
        )
        if os.path.exists(snapshot_path):
            return snapshot_path
        return "dima806/deepfake_vs_real_image_detection"

    def _load_model(self):
        """Loads ViT image classification model from local disk or cache."""
        model_path = self._get_snapshot_path()
        print(f"[Image Model] Loading AI image classifier model from: {model_path}")

        try:
            self.vit_processor = AutoImageProcessor.from_pretrained(model_path)
            self.vit_model = ViTForImageClassification.from_pretrained(model_path)
            self.vit_model.to(self.device)
            self.vit_model.eval()
            self.is_loaded = True
            print(f"[Image Model] ViT Model loaded successfully on device: {self.device}")
        except Exception as e:
            print(f"[Image Model Error] Failed to load ViT model: {e}")
            self.is_loaded = False

    def predict_image_array(self, bgr_image: np.ndarray) -> Tuple[float, float]:
        """
        Runs forward pass on a BGR numpy image array.
        Returns Tuple[real_prob, fake_prob].
        """
        if not self.is_loaded or self.vit_model is None or self.vit_processor is None:
            raise RuntimeError("Image detection model is not loaded.")

        if bgr_image is None or bgr_image.size == 0:
            raise ValueError("Empty or invalid image array provided to predictor.")

        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)

        inputs = self.vit_processor(images=pil_image, return_tensors="pt").to(self.device)

        with torch.no_grad():
            outputs = self.vit_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]

        # id2label: {0: "Real", 1: "Fake"}
        real_prob = float(probs[0].item())
        fake_prob = float(probs[1].item())

        return real_prob, fake_prob

    def predict_batch_crops(self, face_crops: List[np.ndarray]) -> List[float]:
        """
        Runs ViT classification across cropped face patches.
        Returns list of deepfake (fake) probabilities per face.
        """
        if not face_crops:
            return []

        fake_probs = []
        for crop in face_crops:
            try:
                _, fake_p = self.predict_image_array(crop)
                fake_probs.append(fake_p)
            except Exception as e:
                print(f"[Image Model Warning] Crop evaluation error: {e}")
                fake_probs.append(0.5)

        return fake_probs
