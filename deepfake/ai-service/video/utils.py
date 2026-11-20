"""
Utility Functions for Video Deepfake Detection Module (Phase 1 Foundation)
"""

import os
from typing import Dict, Any
from .config import VideoConfig

def validate_video_file(file_path: str, config: VideoConfig = VideoConfig()) -> bool:
    """
    Validates if the target video file exists and has a supported extension.
    """
    if not os.path.exists(file_path):
        return False
    ext = os.path.splitext(file_path)[1].lower()
    return ext in config.SUPPORTED_EXTENSIONS

def extract_video_metadata(file_path: str) -> Dict[str, Any]:
    """
    Extracts basic file metadata for video detection foundation.
    (Detailed OpenCV/FFmpeg metadata extraction to be implemented in future phases).
    """
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    
    file_size = os.path.getsize(file_path)
    ext = os.path.splitext(file_path)[1].lower()
    return {
        "file_path": file_path,
        "file_name": os.path.basename(file_path),
        "file_size_bytes": file_size,
        "extension": ext,
        "status": "ready_for_processing"
    }
