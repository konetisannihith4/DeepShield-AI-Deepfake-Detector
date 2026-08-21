# DeepShield v1.0 Release Notes

**Release Date**: August 4, 2026  
**Version**: 1.0.0 (Release Candidate)  
**Status**: **HACKATHON & PRODUCTION READY**

---

## Highlights

DeepShield v1.0 is an enterprise-grade AI deepfake voice clone & synthetic audio-visual detection engine.

### Key Capabilities

1. **Hybrid Multi-Factor Detection Engine**:
   - Fuses PyTorch Wav2Vec2 neural model embeddings (`HyperMoon/wav2vec2-base-960h-finetuned-deepfake`) with 9 physical acoustic quality features.
   - Extracts MFCCs, Spectral Centroid, Zero Crossing Rate (ZCR), Chroma STFT, Spectral Rolloff, Pitch (F0) Variance, Harmonic-to-Noise Ratio (HNR), Silence Ratio, and RMS Energy.

2. **Telephony-Aware Channel Compensation**:
   - Automatically detects 8kHz / G.711 / AMR narrowband phone call recordings.
   - Applies G.711 de-emphasis normalization, band-pass compensation ($300 - 3400\text{ Hz}$), and adaptive spectral subtraction denoising.

3. **Multi-Format Media Ingestion**:
   - Supports WAV, MP3, AAC, FLAC, OGG, M4A audio files.
   - Supports MP4, AVI, MOV, MKV, WEBM video files with automatic FFmpeg audio track extraction.

4. **Calibrated Continuous Confidence & Risk Metrics**:
   - Enforces calibrated decision threshold $T = 0.69$.
   - Temperature-scaled neural logits prevent 0.9999 probability saturation.
   - Provides continuous, un-clipped confidence scoring across $[0.0, 1.0]$.
