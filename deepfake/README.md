# DeepShield AI v1.0 — Enterprise Deepfake Voice & Media Detection Engine

DeepShield is an AI-powered security platform designed to detect synthetic speech, AI voice clones (ElevenLabs, ChatGPT Voice, Google TTS, Microsoft TTS), and deepfake video audio streams in real-world environments.

---

## Key Features

- **Hybrid Multi-Factor Detection Engine**: Combines Wav2Vec2 neural model embeddings with 9 physical acoustic quality features.
- **Telephony-Aware Channel Compensation**: Automatically detects narrowband 8kHz G.711 phone calls and applies bandpass compensation.
- **Multi-Format Media Support**: WAV, MP3, AAC, FLAC, OGG, M4A audio files & MP4, AVI, MOV, WEBM video containers.
- **Interactive Visualizers**: Waveform canvas, Spectrogram matrix, MFCC heatmap, Pitch contour graph, and Threat Timeline.
- **PDF Report Generation**: Downloadable forensic audit reports.

---

## Quick Start & Installation

### Requirements
- Node.js v20+
- Python 3.10+
- MySQL 8.0+

### Launching Services

1. **FastAPI AI Service**:
   ```powershell
   cd ai-service
   .\venv\Scripts\python.exe app.py
   ```

2. **Express Backend**:
   ```powershell
   cd server
   npm run dev
   ```

3. **React Frontend**:
   ```powershell
   cd client
   npm run dev
   ```

Open browser at: `http://localhost:5173/`
