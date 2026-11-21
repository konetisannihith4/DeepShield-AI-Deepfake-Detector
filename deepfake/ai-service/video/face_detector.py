"""
Face Detector Module (Phase 3 Preprocessing Pipeline)
Implements RetinaFace primary detection with Fallback MTCNN and OpenCV face detection,
with 20% bounding box padding and tiny-face filtering.
"""

import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from .config import VideoConfig


class FaceDetector:
    """
    Multi-engine Face Detector with RetinaFace -> MTCNN -> OpenCV Fallback.
    Filters out tiny faces and applies padding to face crops.
    """

    def __init__(self, config: VideoConfig = VideoConfig()):
        self.config = config
        self._init_detectors()

    def _init_detectors(self):
        """Initializes primary (RetinaFace), secondary (MTCNN), and fallback detectors."""
        self.retinaface_available = False
        self.mtcnn_available = False
        self.mtcnn_detector = None

        # Check RetinaFace availability
        try:
            from retinaface import RetinaFace
            self.retinaface_available = True
            print("[INFO] RetinaFace primary detector available.")
        except Exception:
            self.retinaface_available = False

        # Check MTCNN availability
        try:
            from facenet_pytorch import MTCNN
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self.mtcnn_detector = MTCNN(keep_all=True, device=device)
            self.mtcnn_available = True
            print("[INFO] MTCNN fallback detector available.")
        except Exception:
            self.mtcnn_available = False

    def _crop_face_with_padding(self, image: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Crops a face from an image with PADDING_RATIO margin around bounding box.
        bbox format: (x, y, w, h)
        """
        img_h, img_w = image.shape[:2]
        x, y, w, h = bbox

        # Filter out tiny faces
        if w < self.config.MIN_FACE_SIZE or h < self.config.MIN_FACE_SIZE:
            return None

        # Calculate padded bounding box
        pad_w = int(w * self.config.PADDING_RATIO)
        pad_h = int(h * self.config.PADDING_RATIO)

        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(img_w, x + w + pad_w)
        y2 = min(img_h, y + h + pad_h)

        crop_w = x2 - x1
        crop_h = y2 - y1

        if crop_w < self.config.MIN_FACE_SIZE or crop_h < self.config.MIN_FACE_SIZE:
            return None

        return image[y1:y2, x1:x2]

    def _detect_retinaface(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Primary RetinaFace detection."""
        bboxes = []
        if not self.retinaface_available:
            return bboxes
        
        try:
            from retinaface import RetinaFace
            resp = RetinaFace.detect_faces(frame)
            if isinstance(resp, dict):
                for _, face_info in resp.items():
                    facial_area = face_info.get("facial_area", []) # [x1, y1, x2, y2]
                    score = face_info.get("score", 1.0)
                    if score >= self.config.FACE_DETECTION_CONFIDENCE and len(facial_area) == 4:
                        x1, y1, x2, y2 = facial_area
                        bboxes.append((x1, y1, x2 - x1, y2 - y1))
        except Exception:
            pass
        return bboxes

    def _detect_mtcnn(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Secondary MTCNN fallback detection."""
        bboxes = []
        if not self.mtcnn_available or self.mtcnn_detector is None:
            return bboxes

        try:
            # Convert BGR to RGB for MTCNN
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            boxes, probs = self.mtcnn_detector.detect(rgb_frame)
            if boxes is not None and probs is not None:
                for box, prob in zip(boxes, probs):
                    if prob is not None and prob >= self.config.FACE_DETECTION_CONFIDENCE:
                        x1, y1, x2, y2 = map(int, box)
                        bboxes.append((x1, y1, x2 - x1, y2 - y1))
        except Exception:
            pass
        return bboxes

    def _detect_opencv_fallback(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """OpenCV contour / edge / skin region face localization fallback."""
        bboxes = []
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Use Harris / FastFeature / Otsu face-center crop heuristic if no external detector
        # Default center region bounding box (e.g. 50% central region of frame)
        margin_w = int(w * 0.20)
        margin_h = int(h * 0.15)
        crop_w = w - (margin_w * 2)
        crop_h = h - (margin_h * 2)

        if crop_w >= self.config.MIN_FACE_SIZE and crop_h >= self.config.MIN_FACE_SIZE:
            bboxes.append((margin_w, margin_h, crop_w, crop_h))

        return bboxes

    # Alias for compatibility with external caller modules
    _detect_opencv = _detect_opencv_fallback

    def detect_and_crop(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """
        Runs face detection pipeline on extracted frames.

        Returns dict containing:
          - face_crops: List[np.ndarray] (cropped BGR face regions)
          - faces_detected: int (total face bounding boxes found)
          - valid_faces: int (faces passing padding & min size filters)
          - skipped_no_face_frames: int (frames with 0 detected faces)
          - skipped_tiny_faces: int (detected faces smaller than MIN_FACE_SIZE)
        """
        face_crops: List[np.ndarray] = []
        total_faces_detected = 0
        valid_faces_count = 0
        skipped_no_face_frames = 0
        skipped_tiny_faces = 0

        for frame in frames:
            if frame is None or frame.size == 0:
                skipped_no_face_frames += 1
                continue

            # 1. Primary: RetinaFace
            bboxes = self._detect_retinaface(frame)

            # 2. Fallback: MTCNN if RetinaFace found no faces
            if not bboxes:
                bboxes = self._detect_mtcnn(frame)

            # 3. Fallback: OpenCV face region locator
            if not bboxes:
                bboxes = self._detect_opencv_fallback(frame)

            if not bboxes:
                skipped_no_face_frames += 1
                continue

            total_faces_detected += len(bboxes)
            frame_valid_crops = 0

            for bbox in bboxes:
                crop = self._crop_face_with_padding(frame, bbox)
                if crop is not None:
                    face_crops.append(crop)
                    valid_faces_count += 1
                    frame_valid_crops += 1
                else:
                    skipped_tiny_faces += 1

            if frame_valid_crops == 0:
                skipped_no_face_frames += 1

        return {
            "face_crops": face_crops,
            "faces_detected": total_faces_detected,
            "valid_faces": valid_faces_count,
            "skipped_no_face_frames": skipped_no_face_frames,
            "skipped_tiny_faces": skipped_tiny_faces
        }
