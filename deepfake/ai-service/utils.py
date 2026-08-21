import os
from typing import Tuple

ALLOWED_EXTENSIONS = {
    ".wav", ".mp3", ".flac", ".aac", ".ogg", ".m4a",
    ".mp4", ".mov", ".avi", ".mkv", ".webm"
}
ALLOWED_MIME_TYPES = {
    "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3",
    "audio/flac", "audio/x-flac", "audio/aac", "audio/ogg",
    "audio/m4a", "audio/x-m4a", "audio/mp4",
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"
}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB max

def ensure_directories():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dirs = [
        os.path.join(base_dir, "models"),
        os.path.join(base_dir, "uploads"),
        os.path.join(base_dir, "outputs"),
        os.path.join(base_dir, "debug_wavs")
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    return dirs

def validate_audio_file(filename: str, content_type: str, file_size: int, content_header: bytes) -> Tuple[bool, str]:
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed limit of 100 MB."
    
    ext = os.path.splitext(filename)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Supported: wav, mp3, flac, aac, ogg, m4a, mp4, mov, avi, mkv, webm."

    # Validate executable magic bytes to prevent security exploits
    hex_header = content_header[:8].hex().upper()
    if hex_header.startswith("4D5A") or hex_header.startswith("7F454C46") or hex_header.startswith("FEEDFACE"):
        return False, "Security Violation: Executable file upload detected and rejected."

    return True, "Valid"

def calculate_risk(deepfake_prob: float) -> str:
    if deepfake_prob >= 0.85:
        return "CRITICAL"
    elif deepfake_prob >= 0.60:
        return "HIGH"
    elif deepfake_prob >= 0.30:
        return "MODERATE"
    else:
        return "LOW"
