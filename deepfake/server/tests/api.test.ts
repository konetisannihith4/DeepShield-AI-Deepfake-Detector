import { describe, it, expect } from 'vitest';
import { AIDetectionEngine } from '../src/services/aiDetectionEngine';

describe('DeepShield Comprehensive AI Engine & API Integration Tests', () => {
  it('Validates AI Audio Buffer Feature Extraction Pipeline', () => {
    const dummyBuffer = Buffer.from('deepfake-audio-sample-data-buffer-for-unit-testing');
    const result = AIDetectionEngine.analyzeAudioBuffer(dummyBuffer, 'synthetic_voice.wav', 'audio/wav');

    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0.04);
    expect(result.overallScore).toBeLessThanOrEqual(0.98);
    expect(result.waveformJson.length).toBe(100);
    expect(result.spectrogramJson.length).toBe(32);
    expect(result.mfccJson[0].length).toBe(13);
    expect(result.pitchJson.length).toBe(40);
    expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(result.riskLevel);
    expect(['AUTHENTIC', 'DEEPFAKE', 'SUSPICIOUS', 'PROCESSING', 'FAILED']).toContain(result.status);
  });

  it('Validates Risk Level Threshold Classification', () => {
    const criticalBuffer = Buffer.from('fake-voice-sample-data-buffer');
    const result = AIDetectionEngine.analyzeAudioBuffer(criticalBuffer, 'elevenlabs_synth_fake.wav', 'audio/wav');

    expect(result.overallScore).toBeGreaterThan(0.70);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.status).toBe('DEEPFAKE');
    expect(result.syntheticSegments.length).toBeGreaterThan(0);
  });

  it('Validates Authentic Clean Voice Sample Classification', () => {
    const cleanBuffer = Buffer.from('authentic-natural-speech');
    const result = AIDetectionEngine.analyzeAudioBuffer(cleanBuffer, 'natural_press_speech.wav', 'audio/wav');

    expect(result.features.spectralCentroidMean).toBeGreaterThan(1000);
    expect(result.features.pitchVariance).toBeGreaterThan(0);
  });
});
