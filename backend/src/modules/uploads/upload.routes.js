import express, { Router } from 'express';
import * as uploadController from './upload.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { AppError } from '../../middleware/errorHandler.js';

export const uploadRouter = Router();

const CUSTOMER_ALLOWED_FOLDERS = ['returns'];

function restrictUploadFolder(req, _res, next) {
  if (req.user?.role === 'admin') return next();
  if (CUSTOMER_ALLOWED_FOLDERS.includes(req.body?.type)) return next();
  next(new AppError('Bạn không có quyền tải ảnh cho mục này', 403));
}

uploadRouter.post('/image-url', authenticate, restrictUploadFolder, uploadController.getImageUploadUrl);
uploadRouter.put('/file/*', express.raw({ type: '*/*', limit: '20mb' }), uploadController.uploadLocalFile);
