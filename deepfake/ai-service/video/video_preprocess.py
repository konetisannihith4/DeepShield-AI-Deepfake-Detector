"""
Video Preprocessing Pipeline Module (Phase 3)
Handles Face Crop -> Resize (299x299) -> Normalize (0.5 mean, 0.5 std) -> PyTorch Tensor batch conversion.
"""

import cv2
import numpy as np
import torch
from typing import List, Optional
from .config import VideoConfig


class VideoPreprocessor:
    """
    Standardized video face preprocessor for XceptionNet deepfake model input.
    """

    def __init__(self, config: VideoConfig = VideoConfig()):
        self.config = config

    def preprocess_face(self, face_bgr: np.ndarray) -> torch.Tensor:
        """
        Preprocesses a single BGR face crop into normalized CHW PyTorch tensor.
        Pipeline: BGR -> RGB -> Resize (299x299) -> Normalize -> CHW Tensor
        """
        if face_bgr is None or face_bgr.size == 0:
            raise ValueError("Empty or invalid face crop provided for preprocessing.")

        # 1. Convert BGR to RGB
        rgb_face = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)

        # 2. Resize to Xception input dimensions (299, 299)
        resized_face = cv2.resize(
            rgb_face,
            self.config.TARGET_IMAGE_SIZE,
            interpolation=cv2.INTER_CUBIC
        )

        # 3. Convert to float32 in range [0.0, 1.0]
        float_img = resized_face.astype(np.float32) / 255.0

        # 4. Normalize channels using (img - mean) / std (Xception [-1.0, 1.0] scaling)
        mean = np.array(self.config.NORMALIZE_MEAN, dtype=np.float32)
        std = np.array(self.config.NORMALIZE_STD, dtype=np.float32)
        normalized_img = (float_img - mean) / std

        # 5. Transpose HWC (299, 299, 3) to CHW (3, 299, 299)
        chw_img = np.transpose(normalized_img, (2, 0, 1))

        # 6. Convert to PyTorch Tensor
        return torch.from_numpy(chw_img).float()

    def preprocess_batch(self, face_crops: List[np.ndarray]) -> torch.Tensor:
        """
        Preprocesses a list of face crop numpy arrays into a batched Tensor (N, 3, 299, 299).
        """
        if not face_crops:
            return torch.empty((0, 3, *self.config.TARGET_IMAGE_SIZE), dtype=torch.float32)

        tensors = []
        for face in face_crops:
            tensor = self.preprocess_face(face)
            tensors.append(tensor)

        # Stack into batch tensor (N, 3, 299, 299)
        return torch.stack(tensors, dim=0)
