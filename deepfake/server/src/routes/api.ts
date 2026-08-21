import { Router } from 'express';
import multer from 'multer';
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
apiRouter.get('/auth/verify-email', AuthController.verifyEmail);
apiRouter.post('/auth/resend-verification', authRateLimiter, AuthController.resendVerification);
apiRouter.post('/auth/login', authRateLimiter, AuthController.login);
apiRouter.post('/auth/refresh', AuthController.refresh);
apiRouter.post('/auth/logout', AuthController.logout);
apiRouter.get('/auth/me', authenticateToken, AuthController.getMe);
apiRouter.post('/auth/forgot-password', authRateLimiter, AuthController.forgotPassword);
apiRouter.get('/auth/verify-reset-token', AuthController.verifyResetToken);
apiRouter.post('/auth/reset-password', authRateLimiter, AuthController.resetPassword);

// 2. Detection & AI Endpoints
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

// 3. Admin & User Management Endpoints
apiRouter.get('/users', authenticateToken, AdminController.getUsers);
apiRouter.post('/users', authenticateToken, requireRole(Role.ADMIN), logAuditEvent('USER_CREATE', 'USER'), AdminController.createUser);

apiRouter.get('/organizations', authenticateToken, requireRole(Role.ADMIN), AdminController.getOrganizations);
apiRouter.get('/audit-logs', authenticateToken, requireRole(Role.ADMIN, Role.ANALYST), AdminController.getAuditLogs);

apiRouter.get('/notifications', authenticateToken, AdminController.getNotifications);
apiRouter.put('/notifications/:id/read', authenticateToken, AdminController.markNotificationRead);

apiRouter.get('/settings', authenticateToken, AdminController.getSettings);
apiRouter.put('/settings', authenticateToken, requireRole(Role.ADMIN), logAuditEvent('UPDATE_SETTINGS', 'SYSTEM'), AdminController.updateSettings);

apiRouter.get('/model/details', AdminController.getModelDetails as any);
