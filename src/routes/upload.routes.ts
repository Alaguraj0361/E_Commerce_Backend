import { Router } from 'express';
import {
  uploadMiddleware,
  uploadSingleImage,
  uploadMultipleImages,
} from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/single', authenticate, uploadMiddleware.single('image'), uploadSingleImage);
router.post('/multiple', authenticate, uploadMiddleware.array('images', 10), uploadMultipleImages);

export default router;
