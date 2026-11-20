import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { AuthController } from '../controllers/authController';
import { DetectionController } from '../controllers/detectionController';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { authRateLimiter, apiRateLimiter } from '../middleware/security';
import { logAuditEvent } from '../middleware/auditLogger';
import { Role } from '@prisma/client';

import { MediaProcessor } from '../services/mediaProcessor';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB Max for Audio/Video
  fileFilter: (_req, file, cb) => {
    if (MediaProcessor.isValidMedia(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format (${file.mimetype}). Allowed formats: WAV, MP3, AAC, FLAC, OGG, M4A, MP4, AVI, MOV, MKV, WEBM.`));
    }
  },
});

import videoDetectionRoutes from './videoDetectionRoutes';

export const apiRouter = Router();

// Health Check Endpoint
apiRouter.get('/health', (req, res) => {
  return res.json({
    status: 'HEALTHY',
    service: 'DeepShield AI Detection API Server',
    database: 'MySQL 8 (Prisma ORM)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 1. Auth Endpoints
apiRouter.post('/auth/register', authRateLimiter, AuthController.register);
apiRouter.post('/auth/signup', authRateLimiter, AuthController.register);
apiRouter.post('/auth/verify-otp', authRateLimiter, AuthController.verifyOtp);
apiRouter.post('/auth/resend-otp', authRateLimiter, AuthController.resendOtp);
apiRouter.post('/auth/login', authRateLimiter, AuthController.login);
apiRouter.post('/auth/request-login-otp', authRateLimiter, AuthController.requestLoginOtp);
apiRouter.post('/auth/login-with-otp', authRateLimiter, AuthController.loginWithOtp);
apiRouter.post('/auth/forgot-password', authRateLimiter, AuthController.forgotPassword);
apiRouter.post('/auth/reset-password', authRateLimiter, AuthController.resetPassword);
apiRouter.post('/auth/refresh', AuthController.refresh);
apiRouter.post('/auth/logout', AuthController.logout);
apiRouter.get('/auth/me', authenticateToken, AuthController.getMe);

// 2. Detection & AI Endpoints
const getAiBaseUrl = (): string => {
  const raw = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  return raw.replace(/\/predict\/?$/, '').replace(/\/+$/, '');
};

const proxyToAiService = async (endpoint: string, file: Express.Multer.File | undefined, res: any) => {
  if (!file) {
    return res.status(400).json({ error: 'No media file provided for analysis.' });
  }
  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  try {
    const aiBase = getAiBaseUrl();
    console.log(`[AI Proxy]: Forwarding ${file.originalname} (${file.mimetype}) to ${aiBase}${endpoint}...`);
    const aiRes = await axios.post(`${aiBase}${endpoint}`, formData, {
      headers: formData.getHeaders(),
      timeout: 300000,
    });
    return res.json(aiRes.data);
  } catch (err: any) {
    console.error(`[AI Proxy Error for ${endpoint}]:`, err.message);
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: `AI inference service error: ${err.message}` };
    return res.status(status).json(data);
  }
};

// AI Microservice Direct Proxy Endpoints (Image, Video, Audio)
apiRouter.post('/predict-image', upload.single('file'), (req, res) => proxyToAiService('/predict-image', req.file, res));
apiRouter.post('/predict-video', upload.single('file'), (req, res) => proxyToAiService('/predict-video', req.file, res));
apiRouter.post('/predict-video-efficientnet', upload.single('file'), (req, res) => proxyToAiService('/predict-video-efficientnet', req.file, res));
apiRouter.post('/predict', upload.single('file'), (req, res) => proxyToAiService('/predict', req.file, res));

apiRouter.use('/detect/video', videoDetectionRoutes);

apiRouter.post(
  '/detect/upload',
  authenticateToken,
  apiRateLimiter,
  upload.single('file'),
  logAuditEvent('AUDIO_UPLOAD_ANALYSIS', 'DETECTION'),
  DetectionController.uploadAndAnalyze
);

apiRouter.get(
  '/detect/history',
  authenticateToken,
  DetectionController.getHistory
);

apiRouter.get(
  '/detect/analytics/summary',
  authenticateToken,
  DetectionController.getAnalyticsSummary
);

apiRouter.get(
  '/detect/:id',
  authenticateToken,
  DetectionController.getById
);

apiRouter.get(
  '/detect/:id/report/pdf',
  authenticateToken,
  DetectionController.generatePdfReport
);

// Public Report Verification Endpoint (Scanned via QR Code)
apiRouter.get(
  '/reports/verify/:id',
  DetectionController.verifyReport
);

// Report Management & Exporter Endpoints
apiRouter.get(
  '/reports/history',
  authenticateToken,
  DetectionController.getReportHistory
);

apiRouter.get(
  '/reports/stats',
  authenticateToken,
  DetectionController.getReportStats
);

apiRouter.get(
  '/reports/download/:filename',
  authenticateToken,
  DetectionController.downloadReportFile
);

apiRouter.delete(
  '/reports/:filename',
  authenticateToken,
  DetectionController.deleteReportFile
);

// 3. Admin & User Management Endpoints (Strict RBAC Protection)
apiRouter.get('/users', authenticateToken, requireRole(Role.ADMIN), AdminController.getUsers);
apiRouter.post('/users', authenticateToken, requireRole(Role.ADMIN), logAuditEvent('USER_CREATE', 'USER'), AdminController.createUser);

apiRouter.get('/organizations', authenticateToken, requireRole(Role.ADMIN), AdminController.getOrganizations);
apiRouter.get('/audit-logs', authenticateToken, requireRole(Role.ADMIN), AdminController.getAuditLogs);

apiRouter.get('/notifications', authenticateToken, AdminController.getNotifications);
apiRouter.put('/notifications/:id/read', authenticateToken, AdminController.markNotificationRead);

apiRouter.get('/settings', authenticateToken, requireRole(Role.ADMIN), AdminController.getSettings);
apiRouter.put('/settings', authenticateToken, requireRole(Role.ADMIN), logAuditEvent('UPDATE_SETTINGS', 'SYSTEM'), AdminController.updateSettings);

apiRouter.get('/model/details', authenticateToken, requireRole(Role.ADMIN), AdminController.getModelDetails as any);
