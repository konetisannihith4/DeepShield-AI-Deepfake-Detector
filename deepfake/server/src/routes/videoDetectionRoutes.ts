import { Router } from 'express';
import multer from 'multer';
import { analyzeVideo } from '../controllers/videoDetectionController';
import { authenticateToken } from '../middleware/auth';

const upload = multer({
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max video limit
  },
});

const router = Router();

// POST /api/detect/video
router.post('/', authenticateToken, upload.single('file'), analyzeVideo);

export default router;
