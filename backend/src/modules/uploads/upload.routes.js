import express, { Router } from 'express';
import * as uploadController from './upload.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ALLOWED_IMAGE_EXTS } from '../../services/storage/constants.js';

export const uploadRouter = Router();

const CUSTOMER_ALLOWED_FOLDERS = ['returns'];

function restrictUploadFolder(req, _res, next) {
  if (req.user?.role === 'admin') return next();
  if (CUSTOMER_ALLOWED_FOLDERS.includes(req.body?.type)) return next();
  next(new AppError('Bạn không có quyền tải ảnh cho mục này', 403));
}

/**
 * Với LocalStorage, "presigned URL" chính là route PUT dưới đây nên nó phải tự
 * kiểm tra quyền: URL của MinIO có chữ ký hết hạn, còn ở đây không có gì thay
 * thế. Thư mục lấy từ chính key (body lúc này là Buffer nên không có req.body.type).
 */
function restrictUploadKey(req, _res, next) {
  const key = req.params[0] ?? '';
  const folder = key.split('/')[0];
  const ext = key.slice(key.lastIndexOf('.')).toLowerCase();

  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return next(new AppError('Chỉ tải lên được ảnh JPG, PNG hoặc WEBP', 400));
  }
  if (req.user?.role === 'admin') return next();
  if (CUSTOMER_ALLOWED_FOLDERS.includes(folder)) return next();
  next(new AppError('Bạn không có quyền tải ảnh cho mục này', 403));
}

uploadRouter.post('/image-url', authenticate, restrictUploadFolder, uploadController.getImageUploadUrl);
uploadRouter.put(
  '/file/*',
  authenticate,
  restrictUploadKey,
  express.raw({ type: '*/*', limit: '20mb' }),
  uploadController.uploadLocalFile,
);
