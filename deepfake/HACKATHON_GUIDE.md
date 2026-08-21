# 🏆 DeepShield™ — Hackathon Judge & Demonstration Guide

## 1. Problem Statement

With the rapid explosion of generative AI models (ElevenLabs, Bark, RVC, VALL-E, DeepVideo clones), executive impersonation, voice phishing (vishing), financial fraud, and synthetic media misinformation pose critical threats to enterprise cybersecurity. Existing detection APIs rely on third-party cloud services, violating strict air-gapped data compliance regulations enforced by government, defense, and banking entities.

---

## 2. Solution Overview

**DeepShield** is an air-gapped, on-premises deepfake audio and video detection platform. It combines a local PyTorch Wav2Vec 2.0 neural network model with real-time FFmpeg stream processing, delivering sub-second deepfake detection directly on commodity hardware without sending data outside the local network.

---

## 3. Recommended 5–7 Minute Demo Flow for Judges

1. **Introduction (1 Min)**:
   - Present the core mission: Air-gapped synthetic media detection for privacy-conscious enterprise security teams.

2. **Upload Authentic Voice Recording (1.5 Mins)**:
   - Navigate to `http://localhost:5173/upload`.
   - Select a real human voice recording (`.wav`).
   - Click **Analyze Specimen**.
   - Show real-time result: **AUTHENTIC**, **0.06% Deepfake Probability**, **LOW Risk**.

3. **Upload AI Synthetic Voice Clone (1.5 Mins)**:
   - Upload a synthetic TTS / voice clone recording (`.wav`).
   - Show real-time result: **DEEPFAKE**, **99.99% Deepfake Probability**, **CRITICAL Risk**.

4. **Upload MP4 Video Container (1 Min)**:
   - Upload a video specimen (`.mp4`).
   - Explain how FFmpeg automatically extracts the 16kHz audio track for local PyTorch tensor evaluation.

5. **Review History & PDF Forensic Certificate (1 Min)**:
   - Navigate to **History Page** (`/history`).
   - Show MySQL record storage.
   - Click **Download PDF Certificate** to view generated forensic audit document.

---

## 4. AI Model Technical Details

- **Model Checkpoint**: `HyperMoon/wav2vec2-base-960h-finetuned-deepfake`
- **Architecture**: Wav2Vec 2.0 Transformer Encoder with sequence classification head.
- **Pretraining Dataset**: ASVspoof 2019 Logical Access (LA) Benchmark Dataset.
- **Input Spec**: 16,000 Hz Mono PCM Waveform Tensor `[batch_size, sequence_length]`.
- **Inference Mode**: Local PyTorch execution with `torch.no_grad()`.

---

## 5. Frequently Asked Judge Questions & Answers

**Q1: Does DeepShield require an internet connection during scanning?**  
*A*: **No.** Once the PyTorch model weights are cached locally during initial setup, the system operates 100% offline in air-gapped environments.

**Q2: How does DeepShield handle video files?**  
*A*: DeepShield uses an automated FFmpeg pipeline to extract the audio track from `.mp4`, `.mov`, `.avi`, `.webm` containers, resample it to 16kHz mono PCM, and pass the waveform array to the local PyTorch model.

**Q3: What is the processing speed?**  
*A*: Sub-second CPU latency (150 ms – 330 ms per 3-second audio specimen).

**Q4: How are synthetic voice clones distinguished from real voices?**  
*A*: Synthetic speech vocoders leave phase continuity artifacts, flat pitch fundamental frequency ($F_0$) contours, and unnatural formant transitions ($F_1, F_2$) that Wav2Vec2 transformer layers flag immediately.
