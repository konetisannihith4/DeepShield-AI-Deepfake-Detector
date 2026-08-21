"""
EfficientNet Preprocessing Module
Reproduces Kaggle DFDC 1st-Place Preprocessing Pipeline:
OpenCV -> MTCNN Face Detection -> 30% Margin Crop -> 380x380 Resize -> ImageNet Normalization -> Tensor Batch.
"""

import cv2
import numpy as np
import torch
from typing import List, Dict, Any, Tuple, Optional


class EfficientNetPreprocessor:
    """
    Preprocessing pipeline for EfficientNet-B7 DeepFakeClassifier.
    """

    def __init__(self, target_size: Tuple[int, int] = (380, 380), margin_ratio: float = 0.30):
        self.target_size = target_size
        self.margin_ratio = margin_ratio
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def crop_face_30_margin(self, frame_bgr: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Crops face region with 30% margin.
        bbox format: (x, y, w, h)
        """
        img_h, img_w = frame_bgr.shape[:2]
        x, y, w, h = bbox

        if w < 30 or h < 30:
            return None

        # 30% margin expansion
        margin_w = int(w * self.margin_ratio)
        margin_h = int(h * self.margin_ratio)

        x1 = max(0, x - margin_w)
        y1 = max(0, y - margin_h)
        x2 = min(img_w, x + w + margin_w)
        y2 = min(img_h, y + h + margin_h)

        if (x2 - x1) < 30 or (y2 - y1) < 30:
            return None

        return frame_bgr[y1:y2, x1:x2]

    def preprocess_crop(self, face_bgr: np.ndarray) -> torch.Tensor:
        """
        Preprocesses BGR face crop into 380x380 ImageNet normalized CHW tensor.
        """
        # BGR -> RGB
        rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)

        # Resize to 380x380 for EfficientNet-B7
        resized = cv2.resize(rgb, self.target_size, interpolation=cv2.INTER_CUBIC)

        # Normalize to ImageNet mean and std
        float_img = resized.astype(np.float32) / 255.0
        norm_img = (float_img - self.mean) / self.std

        # Transpose HWC -> CHW
        chw = np.transpose(norm_img, (2, 0, 1))
        return torch.from_numpy(chw).float()

    def preprocess_batch(self, face_crops: List[np.ndarray]) -> torch.Tensor:
        """
        Batches preprocessed face crops into PyTorch tensor (N, 3, 380, 380).
        """
        if not face_crops:
            return torch.empty((0, 3, *self.target_size), dtype=torch.float32)

        tensors = [self.preprocess_crop(crop) for crop in face_crops]
        return torch.stack(tensors, dim=0)
