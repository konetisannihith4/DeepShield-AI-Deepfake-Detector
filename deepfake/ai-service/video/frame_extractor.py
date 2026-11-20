"""
Dynamic Frame Extractor Module (Phase 3 Preprocessing Pipeline)
Extracts frames using OpenCV with dynamic rate based on video duration,
filtering out corrupted and blurry frames.
"""

import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from .config import VideoConfig


class FrameExtractor:
    """
    OpenCV-based dynamic frame extractor with quality filter.
    """

    def __init__(self, config: VideoConfig = VideoConfig()):
        self.config = config

    def is_blurry(self, frame: np.ndarray) -> Tuple[bool, float]:
        """
        Determines if a frame is blurry using OpenCV Laplacian variance.
        """
        if frame is None or frame.size == 0:
            return True, 0.0
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blur = blur_score < self.config.BLUR_THRESHOLD
        return is_blur, blur_score

    def extract_frames(self, video_path: str) -> Dict[str, Any]:
        """
        Extracts frames dynamically based on video duration.
        Ignores corrupted and blurry frames.

        Returns dict containing:
          - frames: List[np.ndarray] (valid BGR image frames)
          - frames_extracted: int
          - skipped_frames: int
          - total_video_frames: int
          - duration_seconds: float
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Corrupted or unreadable video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        fps = fps if fps and fps > 0 else 30.0
        duration_sec = total_frames / fps if total_frames > 0 else 0.0

        # Dynamic frame sampling interval calculation
        if total_frames <= 0:
            sample_interval = 1
        else:
            raw_interval = int(total_frames / self.config.TARGET_FRAMES_COUNT)
            sample_interval = max(
                self.config.MIN_SAMPLE_INTERVAL,
                min(self.config.MAX_SAMPLE_INTERVAL, raw_interval)
            )

        extracted_frames: List[np.ndarray] = []
        frames_extracted_count = 0
        skipped_frames_count = 0
        current_frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret or frame is None:
                # Corrupted or end of video stream
                break

            # Process only frames landing on the dynamic interval
            if current_frame_idx % sample_interval == 0:
                # Check for blurriness
                blurry, blur_score = self.is_blurry(frame)
                if blurry:
                    skipped_frames_count += 1
                else:
                    extracted_frames.append(frame)
                    frames_extracted_count += 1
            else:
                skipped_frames_count += 1

            current_frame_idx += 1

            # Cap max frames to prevent memory overflow
            if len(extracted_frames) >= self.config.TARGET_FRAMES_COUNT:
                break

        cap.release()

        return {
            "frames": extracted_frames,
            "frames_extracted": frames_extracted_count,
            "skipped_frames": skipped_frames_count,
            "total_video_frames": total_frames,
            "duration_seconds": duration_sec,
            "sample_interval": sample_interval
        }
