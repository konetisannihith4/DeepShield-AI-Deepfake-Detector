# AI Signal Processing & Neural Classifier Guide

## Feature Extraction Algorithms

1. **Audio Waveform**: Time-domain amplitude values normalized between -1.0 and +1.0 across 100 sample points.
2. **FFT Spectrogram**: Short-Time Fourier Transform (STFT) computing spectral energy across 16 frequency bands (0-8 kHz) and 32 temporal frames.
3. **MFCC Matrix**: 13 Mel-Frequency Cepstral Coefficients tracking acoustic vocal envelope features.
4. **Pitch Track (F0)**: Fundamental frequency contour tracking in Hz, identifying robotic pitch flatlines and synthetic vocoder phase discontinuities.
5. **Risk Meter**: Evaluates deepfake probability and assigns risk levels:
   - `0.80 - 1.00`: **CRITICAL RISK** (DEEPFAKE)
   - `0.60 - 0.79`: **HIGH RISK** (DEEPFAKE)
   - `0.40 - 0.59`: **MODERATE RISK** (SUSPICIOUS)
   - `0.00 - 0.39`: **LOW RISK** (AUTHENTIC)
