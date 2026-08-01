import { z } from 'zod';
import { IMAGE_FOLDERS, MAX_IMAGE_BYTES } from '../../services/storage/index.js';

// Client chỉ chọn được `type` trong danh sách cố định — không tự đặt đường dẫn lưu.
export const imageUploadUrlSchema = z.object({
  type: z.enum(IMAGE_FOLDERS, {
    errorMap: () => ({ message: `Loại ảnh phải là một trong: ${IMAGE_FOLDERS.join(', ')}` }),
  }),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Ảnh chỉ chấp nhận JPG, PNG hoặc WEBP' }),
  }),
  size:         z.number().int().positive().max(MAX_IMAGE_BYTES, 'Ảnh tối đa 5MB'),
  originalName: z.string().max(255).default(''),
});
