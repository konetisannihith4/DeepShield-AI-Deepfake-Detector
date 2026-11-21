import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { prisma } from '../db/prisma';
import { generateForensicPdfCertificate } from '../services/pdfReportService';

const getAiBaseUrl = (): string => {
  const raw = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  return raw.replace(/\/predict\/?$/, '').replace(/\/+$/, '');
};

export const analyzeVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No video file provided in upload.' });
      return;
    }

    const videoBuffer = req.file.buffer;
    const filename = req.file.originalname || 'specimen.mp4';
    const mimeType = req.file.mimetype || 'video/mp4';
    const fileSize = videoBuffer.length;

    // 1. Calculate Cryptographic SHA-256 Hash
    const sha256Hash = crypto.createHash('sha256').update(videoBuffer).digest('hex');

    // 2. Dispatch to Python FastAPI XceptionNet Video Inference Engine
    const formData = new FormData();
    formData.append('file', videoBuffer, {
      filename,
      contentType: mimeType,
    });

    let aiResponse;
    try {
      aiResponse = await axios.post(`${getAiBaseUrl()}/predict-video`, formData, {
        headers: formData.getHeaders(),
        timeout: 300000, // 5 min timeout for video frame extraction & EfficientNet/XceptionNet inference
      });
    } catch (aiErr: any) {
      console.error('[Video AI Service Connection Error]:', aiErr.message);
      const detail = aiErr.response?.data?.detail || aiErr.message || 'XceptionNet Inference engine connection failed.';
      res.status(500).json({ error: detail });
      return;
    }

    const aiResult = aiResponse.data;

    // Handle "No detectable face found." case cleanly
    const isNoFace = aiResult.Prediction === 'No detectable face found.' || aiResult.prediction === 'No detectable face found.';
    const predictionText = isNoFace
      ? 'No detectable face found.'
      : (aiResult.Prediction || aiResult.prediction || 'Natural');

    const isDeepfake =
      predictionText === 'AI Generated' ||
      predictionText === 'AI-Generated' ||
      predictionText === 'Deepfake' ||
      predictionText === 'Fake' ||
      (typeof aiResult.deepfakeProbability === 'number' && aiResult.deepfakeProbability >= 0.50);
    const verdict = isNoFace ? 'SUSPICIOUS' : (isDeepfake ? 'DEEPFAKE' : 'AUTHENTIC');

    const confidence = aiResult.Confidence !== undefined ? aiResult.Confidence : (aiResult.confidence || 0.0);
    const prob = isDeepfake ? confidence : (1.0 - confidence);

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (isDeepfake) {
      riskLevel = confidence >= 0.85 ? 'CRITICAL' : (confidence >= 0.70 ? 'HIGH' : 'MODERATE');
    }

    // Resolve Organization ID safely to prevent foreign key constraint violations
    let orgId: string = req.user?.organizationId || '';
    let validOrg = null;
    if (orgId) {
      validOrg = await prisma.organization.findUnique({ where: { id: orgId } }).catch(() => null);
    }
    if (!validOrg) {
      validOrg = await prisma.organization.findFirst().catch(() => null);
      if (validOrg) {
        orgId = validOrg.id;
      } else {
        const newOrg = await prisma.organization.create({
          data: {
            name: 'Enterprise Cybersecurity Corp',
            slug: 'enterprise-cybersecurity-corp',
            plan: 'ENTERPRISE',
            apiKey: `ds-api-key-${Date.now()}`,
          },
        });
        orgId = newOrg.id;
      }
    }

    const framesExtracted = aiResult['Frames Extracted'] ?? aiResult.framesExtracted ?? 0;
    const validFramesUsed = aiResult['Valid Frames'] ?? aiResult.validFramesUsed ?? 0;
    const facesDetected = aiResult.Faces ?? aiResult.facesDetected ?? 0;
    const procTimeSec = typeof aiResult['Processing Time'] === 'number'
      ? aiResult['Processing Time']
      : parseFloat(String(aiResult['Processing Time'] || aiResult.processingTime || '0').replace(/[^\d.]/g, ''));

    // 3. Save to Prisma DB History with authenticated User ID ownership
    const detectionRecord = await prisma.detectionHistory.create({
      data: {
        userId: req.user?.id,
        originalFileName: filename,
        storedFileName: filename,
        fileName: filename,
        mediaType: 'VIDEO',
        mimeType,
        fileSize,
        duration: aiResult.durationSeconds || 0,
        durationSeconds: aiResult.durationSeconds || 0,
        sampleRate: 0,
        channels: 0,
        fileHash: sha256Hash,
        waveformData: [],
        waveformJson: [],
        spectrogramData: [],
        spectrogramJson: [],
        mfccData: [],
        mfccJson: [],
        pitchData: [],
        pitchJson: [],
        confidence: confidence,
        deepfakeProbability: prob,
        overallScore: prob,
        riskLevel: riskLevel,
        verdict: verdict,
        status: verdict === 'DEEPFAKE' ? 'DEEPFAKE' : (verdict === 'SUSPICIOUS' ? 'SUSPICIOUS' : 'AUTHENTIC'),
        processingTime: procTimeSec,
        modelVersion: 'FaceForensics++ XceptionNet Engine (ffpp_c23.pth)',
        syntheticSegments: [],
        organizationId: orgId,
      },
    });

    // 4. Generate Forensic PDF & JSON Reports
    let reportFiles: any = null;
    try {
      reportFiles = await generateForensicPdfCertificate({
        id: detectionRecord.id,
        originalFileName: filename,
        fileSize,
        mimeType,
        mediaType: 'VIDEO',
        durationSeconds: aiResult.durationSeconds || 0,
        fileHash: sha256Hash,
        confidence,
        deepfakeProbability: prob,
        overallScore: prob,
        riskLevel,
        verdict: predictionText,
        status: verdict,
        processingTime: procTimeSec,
        modelVersion: 'FaceForensics++ XceptionNet Engine (ffpp_c23.pth)',
      });
    } catch (reportErr: any) {
      console.warn('[Video Controller Report Gen Warning]:', reportErr.message);
    }

    const caseId = reportFiles?.caseId || `VID-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    res.status(200).json({
      success: true,
      detection: {
        id: detectionRecord.id,
        caseId,
        filename,
        mediaType: 'VIDEO',
        prediction: predictionText,
        verdict: predictionText,
        confidence: confidence,
        deepfakeProbability: prob,
        threatLevel: riskLevel,
        riskLevel: riskLevel,
        framesExtracted,
        validFramesUsed,
        facesDetected,
        processingTime: procTimeSec > 0 ? `${procTimeSec}s` : (aiResult['Processing Time'] || '0 s'),
        sha256Hash,
        pdfFileName: reportFiles?.pdfFileName,
        jsonFileName: reportFiles?.jsonFileName,
        createdAt: detectionRecord.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Analyze Video Controller Error]:', error);
    res.status(500).json({ error: error.message || 'Video analysis failed.' });
  }
};
