# DeepShield v1.0 Deployment Guide

**Target Environment**: Local On-Premises Development & Enterprise Container Runtime  
**Version**: 1.0.0 (Release Candidate)  

---

## Service Architecture Overview

DeepShield consists of 3 decoupled microservices:

1. **FastAPI AI Service** (`ai-service`): PyTorch inference engine listening on port `8000`.
2. **Express API Server** (`server`): Node.js backend listening on port `5000`.
3. **React Vite Dashboard** (`client`): Single Page Web App listening on port `5173`.

---

## 1. Local Quick Start

### Step 1: Start FastAPI AI Service
```powershell
cd c:\Deepshield\deepfake\ai-service
.\venv\Scripts\python.exe app.py
```

### Step 2: Start Express Backend
```powershell
cd c:\Deepshield\deepfake\server
npm run dev
```

### Step 3: Start React Frontend
```powershell
cd c:\Deepshield\deepfake\client
npm run dev
```

Navigate browser to: `http://localhost:5173/`
