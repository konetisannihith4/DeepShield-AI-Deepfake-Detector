# DeepShield v1.0 Project Structure

```text
c:\Deepshield\deepfake\
├── ai-service/                # FastAPI PyTorch AI Inference Service
│   ├── app.py                 # FastAPI application routes (GET /, POST /predict)
│   ├── inference.py           # Hybrid Multi-Factor Detection Engine
│   ├── preprocess.py          # Telephony-aware preprocessor & acoustic extractor
│   ├── utils.py               # Security validation & risk level calculation
│   └── requirements.txt       # Python dependency manifest
├── server/                    # Express Node.js Backend API
│   ├── src/
│   │   ├── controllers/       # Scan history & detection controllers
│   │   ├── routes/            # Express endpoint routers
│   │   └── services/          # AI Service integration & FFmpeg audio extraction
│   ├── prisma/                # Prisma ORM schema & MySQL migrations
│   └── package.json           # Node.js backend package manifest
├── client/                    # React 18 + Vite Frontend Dashboard
│   ├── src/
│   │   ├── components/ai/     # Waveform, Spectrogram, MFCC, Pitch, & Meter visualizers
│   │   ├── pages/             # Dashboard, Upload, History, & Realtime pages
│   │   └── services/          # Axios API client
│   └── package.json           # React frontend package manifest
├── RELEASE_NOTES.md           # Version 1.0.0 release notes
├── DEPLOYMENT_GUIDE.md        # Complete deployment instructions
├── PROJECT_STRUCTURE.md       # Directory layout documentation
├── docker-compose.yml         # Container orchestration manifest
└── Dockerfile                 # Production multi-stage Docker build file
```
