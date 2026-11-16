# DeepShield AI Enterprise Detection Platform — Complete Deployment Guide

This guide provides end-to-end instructions for deploying the **DeepShield AI Deepfake Detection Platform** across modern cloud hosting providers (**Vercel, Render, Railway**) and connecting a managed database.

---

## Architecture Overview

```
                               ┌────────────────────────────────┐
                               │   Vercel / Render Static UI    │
                               │   (React + Vite Single-Page)   │
                               └───────────────┬────────────────┘
                                               │ HTTPS / REST & WSS
                                               ▼
                               ┌────────────────────────────────┐
                               │   Render / Railway Backend     │
                               │   (Node.js + Express API)      │
                               └───────┬────────────────┬───────┘
                                       │                │
                      Prisma ORM SQL   │                │ Proxy / Ingest
                                       ▼                ▼
                 ┌───────────────────────┐   ┌─────────────────────────────┐
                 │  Railway / Aiven DB   │   │  Render / Railway AI Engine │
                 │  (Managed MySQL 8.0)  │   │  (Python FastAPI + PyTorch) │
                 └───────────────────────┘   └─────────────────────────────┘
```

---

## 1. Push Project to GitHub

All sensitive keys, large models, and virtual environments (`.venv`, `node_modules`, `deepfake.zip`, etc.) are pre-configured in `.gitignore`.

Run the following commands in PowerShell from the project root:

```powershell
# 1. Review status to confirm clean staging
git status

# 2. Add all updated source code & deployment configs
git add .

# 3. Create commit
git commit -m "feat: Royal Blue + Light Cream theme, Dark Cyber mode, progress bar, and cloud deployment configs"

# 4. Push to your GitHub repository
git push origin main
```

---

## 2. Deploy Database (1-Click on Railway or Aiven)

The application uses **MySQL 8.0** with **Prisma ORM**.

### Option A: Railway (Fastest — 1 Minute)
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Provision MySQL**.
3. Once provisioned, click on the MySQL service → **Variables** tab.
4. Copy the `DATABASE_URL` (format: `mysql://root:password@...railway.app:3306/railway`).
5. (Optional) Run database schema migrations from your terminal:
   ```powershell
   cd deepfake/server
   $env:DATABASE_URL="your_railway_database_url_here"
   npx prisma db push
   ```

### Option B: Aiven / PlanetScale
1. Create a free MySQL database on [aiven.io](https://aiven.io).
2. Copy the Service URI `mysql://user:pass@host:port/defaultdb?ssl-mode=REQUIRED`.

---

## 3. Deploy AI Service (FastAPI / PyTorch)

The AI microservice performs PyTorch neural model inference for audio, video, and image detection.

### On Render:
1. Go to [render.com](https://render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `konetisannihith4/DeepShield-AI-Deepfake-Detector`.
3. Configure the settings:
   - **Name:** `deepshield-ai-service`
   - **Root Directory:** `deepfake/ai-service`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Standard` (at least 2GB RAM recommended for PyTorch models)
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
5. Click **Create Web Service**.
6. Once deployed, copy your AI Service URL (e.g., `https://deepshield-ai-service.onrender.com`).

---

## 4. Deploy Backend Server (Express + Node.js)

### On Render:
1. Click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name:** `deepshield-backend`
   - **Root Directory:** `deepfake/server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Starter`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Your MySQL connection URL from Step 2)*
   - `AI_SERVICE_URL`: `https://deepshield-ai-service.onrender.com/predict` *(From Step 3)*
   - `JWT_SECRET`: *(Any secure random 32-character string)*
   - `JWT_REFRESH_SECRET`: *(Any secure random 32-character string)*
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` *(Update once frontend is created)*
5. Click **Create Web Service**.
6. Copy your Backend URL (e.g., `https://deepshield-backend.onrender.com`).

---

## 5. Deploy Frontend (React + Vite SPA)

### Option A: Vercel (Recommended — Ultra Fast Global CDN)
1. Go to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository: `konetisannihith4/DeepShield-AI-Deepfake-Detector`.
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit → select `deepfake/client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://deepshield-backend.onrender.com/api` *(Your Backend URL)*
5. Click **Deploy**.
6. Vercel automatically deploys with the included `vercel.json` SPA rewrite rule, ensuring all client-side routes (`/dashboard`, `/upload`, `/video-detection`, `/settings`) work without 404 errors.

### Option B: Render Static Site
1. Click **New +** → **Static Site**.
2. Root Directory: `deepfake/client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add Rewrite Rule: Source: `/*` → Destination: `/index.html`.
6. Environment Variable: `VITE_API_URL` = `https://deepshield-backend.onrender.com/api`.

---

## 6. Verification Checklist

- [ ] **Database Connection:** Backend logs display `🚀 DeepShield Enterprise AI Detection Server Running` with Prisma connected.
- [ ] **CORS Configuration:** `CLIENT_URL` in backend matches frontend domain.
- [ ] **AI Service Communication:** Image, video, and audio file uploads successfully call AI microservice and return classifications.
- [ ] **Theme Switching:** Both **Royal Blue + Light Cream** and **Dark Cyber Mode** toggle cleanly via Navbar button and System Settings.
- [ ] **Measurable Progress Bar:** Upload bytes and neural inference stages calculate and display in real time.
