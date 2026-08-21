# 📡 DeepShield™ REST API Documentation

## Base URLs
- **Node.js Express Backend API**: `http://localhost:5000/api`
- **Python FastAPI AI Microservice**: `http://localhost:8000`

---

## 1. Authentication Endpoints (Backend API)

### `POST /api/auth/register`
Registers a new enterprise user account.

**Request Body (`application/json`)**:
```json
{
  "name": "Jane Doe",
  "email": "jane@enterprise.com",
  "password": "SecurePassword123!",
  "organizationName": "Acme Cyber Security"
}
```

**Response (`201 Created`)**:
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@enterprise.com", "role": "USER" },
    "token": "jwt_access_token_string"
  }
}
```

### `POST /api/auth/login`
Authenticates user credentials and returns JWT access & refresh tokens.

---

## 2. Detection & Inspection Endpoints

### `POST /api/detect/upload`
Uploads an audio (`.wav`, `.mp3`, `.flac`) or video (`.mp4`, `.mov`, `.avi`) file for deepfake forensic analysis.

**Headers**:
- `Authorization`: `Bearer <jwt_token>`
- `Content-Type`: `multipart/form-data`

**Form Parameters**:
- `file`: Media File Binary (Max 100MB)

**Response (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
    "id": "c7f8c274-9efe-4b3a-b56f-8e5bdad58306",
    "originalFileName": "sample_recording.wav",
    "mediaType": "AUDIO",
    "durationSeconds": 3.0,
    "confidence": 99.9,
    "deepfakeProbability": 0.0006,
    "overallScore": 0.0006,
    "riskLevel": "LOW",
    "verdict": "AUTHENTIC",
    "status": "AUTHENTIC",
    "processingTime": 0.33,
    "modelVersion": "Wav2Vec2 Deepfake Detector v1.0 (HyperMoon/wav2vec2-base-960h-finetuned-deepfake)"
  }
}
```

### `GET /api/detect/history`
Returns paginated detection scan history stored in MySQL.

### `GET /api/detect/:id/report/pdf`
Returns an HTML / PDF printable certificate for a specific inspection specimen.

---

## 3. Python FastAPI AI Service Endpoints

### `GET /`
Health check and model status.

**Response (`200 OK`)**:
```json
{
  "status": "online",
  "service": "DeepShield AI Deepfake Detection Service",
  "model_checkpoint": "HyperMoon/wav2vec2-base-960h-finetuned-deepfake",
  "device": "cpu"
}
```

### `POST /predict`
Performs local PyTorch tensor inference on an incoming audio file stream.

**Request (`multipart/form-data`)**:
- `file`: Audio File Binary (16kHz PCM WAV recommended)

**Response (`200 OK`)**:
```json
{
  "prediction": "Authentic",
  "confidence": 0.9994,
  "deepfakeProbability": 0.0006,
  "risk": "LOW",
  "processingTime": "331 ms",
  "processingTimeMs": 331,
  "modelVersion": "Wav2Vec2 Deepfake Detector v1.0 (HyperMoon/wav2vec2-base-960h-finetuned-deepfake)"
}
```
