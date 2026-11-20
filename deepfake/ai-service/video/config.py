"""
Video Detection Module Configuration
Configuration structures for Video Deepfake Detection (Phase 3 Preprocessing)
"""

import os
from dataclasses import dataclass, field
from typing import Tuple, List

@dataclass
class VideoConfig:
    """Configuration settings for video deepfake detection pipeline."""

    # Model Weights Path
    MODEL_WEIGHTS_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "pretrained_model",
        "ffpp_c23.pth"
    )

    # Dynamic Frame Extraction Settings
    TARGET_FRAMES_COUNT: int = 30  # Dynamic frame count target
    MIN_SAMPLE_INTERVAL: int = 2   # Minimum step size between frames
    MAX_SAMPLE_INTERVAL: int = 60  # Maximum step size between frames

    # Filtering Criteria
    BLUR_THRESHOLD: float = 80.0   # Laplacian variance threshold for blur detection
    MIN_FACE_SIZE: int = 40        # Minimum face crop dimension (px)

    # Face Detection & Crop Settings
    FACE_DETECTION_CONFIDENCE: float = 0.85
    PADDING_RATIO: float = 0.20    # 20% margin around detected face

    # Preprocessing & Normalization Settings
    TARGET_IMAGE_SIZE: Tuple[int, int] = (299, 299)  # Xception input resolution
    NORMALIZE_MEAN: Tuple[float, float, float] = (0.5, 0.5, 0.5)
    NORMALIZE_STD: Tuple[float, float, float] = (0.5, 0.5, 0.5)

    # Inference & Batching Settings
    BATCH_SIZE: int = 8
    DEVICE: str = "cuda"  # fallback to 'cpu' if CUDA unavailable

    # Aggregation Strategy
    AGGREGATION_METHOD: str = "mean"  # Options: 'mean', 'max', 'trimmed_mean'

    # Supported File Extensions
    SUPPORTED_EXTENSIONS: List[str] = field(
        default_factory=lambda: [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    )
