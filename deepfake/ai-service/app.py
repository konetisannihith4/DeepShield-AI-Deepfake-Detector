import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from utils import ensure_directories, validate_audio_file
from inference import LocalAudioDeepfakeDetector
from video_inference import LocalVideoDeepfakeDetector
from efficientnet_video_inference import EfficientNetVideoInferenceEngine
from image_ai_detector import ImageAIDetectorEngine


# Ensure models/, uploads/, outputs/ directories exist
ensure_directories()

efficientnet_engine = None
image_engine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global efficientnet_engine

    print(
        "[FastAPI Server Startup]: "
        "Initializing PyTorch AI Deepfake Model Engines..."
    )

    # Initialize audio detector
    detector = LocalAudioDeepfakeDetector.get_instance()

    if not detector.is_ready:
        raise RuntimeError(
            "Audio AI Deepfake Engine failed to initialize during server startup."
        )

    # Initialize video detector
    video_detector = LocalVideoDeepfakeDetector.get_instance()

    if not video_detector.is_ready:
        print(
            "[FastAPI Server Startup Warning]: "
            "Video AI Engine lazy load on first request."
        )

    # Initialize EfficientNet video engine
    print(
        "[FastAPI Server Startup]: "
        "Pre-initializing EfficientNet-B7 DeepFakeClassifier Engine..."
    )

    efficientnet_engine = EfficientNetVideoInferenceEngine()

    print(
        "[FastAPI Server Startup]: "
        "AI Services initialized and ready to accept inference requests."
    )

    yield

    print(
        "[FastAPI Server Shutdown]: "
        "Cleaning up AI Service resources."
    )


app = FastAPI(
    title="DeepShield Local Deepfake Detection API",
    description=(
        "On-premises local PyTorch inference service for "
        "synthetic audio, video, image, and voice clone detection."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# Enable CORS for local Node backend / dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "AI Service Running"}


# ============================================================
# AUDIO DEEPFAKE DETECTION
# ============================================================

@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):

    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing audio file specimen in multipart request."
        )

    try:
        content = await file.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty media file specimen uploaded."
            )

        # Security & Magic Byte Validation
        is_valid, err_msg = validate_audio_file(
            file.filename,
            file.content_type,
            file_size,
            content[:16]
        )

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err_msg
            )

        # Run Local PyTorch Audio Model
        detector = LocalAudioDeepfakeDetector.get_instance()

        result = detector.predict(
            content,
            filename=file.filename or "upload_specimen.wav"
        )

        return JSONResponse(
            status_code=200,
            content=result
        )

    except HTTPException as he:
        raise he

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except Exception as e:
        print(f"[AI Service Error during /predict]: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference processing failure: {str(e)}"
        )


# ============================================================
# XCEPTION VIDEO DEEPFAKE DETECTION
# ============================================================

@app.post("/predict-video")
async def predict_video(file: UploadFile = File(...)):

    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing video specimen in multipart request."
        )

    try:
        content = await file.read()

        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty video file specimen uploaded."
            )

        # Run Local PyTorch XceptionNet Video Inference Engine
        video_detector = LocalVideoDeepfakeDetector.get_instance()

        result = video_detector.predict_video(
            content,
            filename=file.filename or "video_specimen.mp4"
        )

        return JSONResponse(
            status_code=200,
            content=result
        )

    except HTTPException as he:
        raise he

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except Exception as e:
        print(f"[AI Service Error during /predict-video]: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video inference processing failure: {str(e)}"
        )


# ============================================================
# EFFICIENTNET-B7 VIDEO DEEPFAKE DETECTION
# ============================================================

@app.post("/predict-video-efficientnet")
async def predict_video_efficientnet(file: UploadFile = File(...)):

    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing video specimen in multipart request."
        )

    try:
        content = await file.read()

        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty video file specimen uploaded."
            )

        global efficientnet_engine

        if efficientnet_engine is None:
            efficientnet_engine = EfficientNetVideoInferenceEngine()

        result = efficientnet_engine.predict_video_bytes(
            content,
            filename=file.filename or "video_specimen.mp4"
        )

        return JSONResponse(
            status_code=200,
            content=result
        )

    except HTTPException as he:
        raise he

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except Exception as e:
        print(
            f"[AI Service Error during "
            f"/predict-video-efficientnet]: {e}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "EfficientNet video inference processing failure: "
                f"{str(e)}"
            )
        )


# ============================================================
# EFFICIENTNET-B7 IMAGE DEEPFAKE DETECTION
# ============================================================

@app.post("/predict-image")
async def predict_image(file: UploadFile = File(...)):

    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing image file."
        )

    try:
        content = await file.read()

        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file uploaded."
            )

        global image_engine

        # Lazy-load image engine on first image request
        if image_engine is None:
            print(
                "[Image AI] Initializing image detection engine..."
            )

            image_engine = ImageAIDetectorEngine()

        result = image_engine.predict_image_bytes(
            content,
            filename=file.filename or "image.jpg"
        )

        return JSONResponse(
            status_code=200,
            content=result
        )

    except HTTPException as he:
        raise he

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    except Exception as e:
        print(
            f"[AI Service Error during /predict-image]: {e}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Image inference processing failure: "
                f"{str(e)}"
            )
        )


# ============================================================
# START FASTAPI SERVER
# ============================================================

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )