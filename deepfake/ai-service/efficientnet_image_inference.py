"""
Image Deepfake & Synthetic Generation Detection Engine Wrapper

Maintains backward compatibility for efficientnet_image_inference imports by wrapping ImageAIDetectorEngine.
"""

from image_ai_detector import ImageAIDetectorEngine, EfficientNetImageInferenceEngine

__all__ = ["ImageAIDetectorEngine", "EfficientNetImageInferenceEngine"]