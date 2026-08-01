import { BLOCKED_MIMES } from './constants.js';
import { AppError } from '../../middleware/errorHandler.js';

const MB = 1024 * 1024;

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export const MAX_IMAGE_BYTES = 5 * MB;

export const MimeValidator = {
  assertNotBlocked(mimeType) {
    if (BLOCKED_MIMES.has(mimeType)) {
      throw new AppError(`Loại file không được phép: ${mimeType}`, 422);
    }
  },

  /** Ảnh hiển thị công khai: bài viết, sản phẩm, danh mục, bộ sưu tập. */
  assertImage(mimeType, sizeBytes) {
    this.assertNotBlocked(mimeType);
    if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
      throw new AppError('Ảnh chỉ chấp nhận JPG, PNG hoặc WEBP', 422);
    }
    if (sizeBytes !== undefined && sizeBytes > MAX_IMAGE_BYTES) {
      throw new AppError('Ảnh không được vượt quá 5MB', 422);
    }
  },
};
