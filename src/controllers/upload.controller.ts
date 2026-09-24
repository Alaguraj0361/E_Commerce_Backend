import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|webp|svg|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, SVG, GIF) are allowed'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

export const uploadSingleImage = (req: Request, res: Response): void => {
  if (!req.file) {
    sendError(res, 'No image file uploaded', 400);
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  sendSuccess(res, 'Image uploaded successfully', { url: fileUrl });
};

export const uploadMultipleImages = (req: Request, res: Response): void => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    sendError(res, 'No image files uploaded', 400);
    return;
  }
  const urls = files.map((f) => `/uploads/${f.filename}`);
  sendSuccess(res, 'Images uploaded successfully', { urls });
};
