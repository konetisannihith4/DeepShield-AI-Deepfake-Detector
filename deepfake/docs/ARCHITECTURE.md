# Architecture & Threat Model Guide

## System Topology & Component Layout

```
[ Web Client / WebAudio API ] 
      |
      |-- (REST APIs: /api/detect/upload, /api/auth) --> [ Express API Controllers ]
      |-- (WebSockets: Realtime Telemetry) -----------> [ Socket.IO Stream Server ]
                                                                |
                                                                v
                                                   [ AI Signal Detection Engine ]
                                                                |
                                                                v
                                                   [ MySQL 8 Database (Prisma ORM) ]
```

## AI Signal Processing Engine Pipeline
1. **Time Domain Analysis**: Calculates RMS energy and 100-point normalized waveform curves.
2. **Frequency Domain Analysis**: Runs 64-band FFT Fast Fourier Transform to extract 2D Spectrogram power heatmaps (0-8000 Hz).
3. **Cepstral Domain Analysis**: Extracts 13 Mel-Frequency Cepstral Coefficients (MFCC) to evaluate vocal tract transfer functions.
4. **Prosodic Pitch Tracking**: Plots Fundamental Pitch Contour (F0) to identify synthetic robotic pitch flatlining or staircase vocoder artifacts.
