import path from 'path';
import { randomUUID } from 'crypto';
import { MIME_TO_EXT, IMAGE_FOLDERS } from './constants.js';

// Đuôi file lấy từ tên gốc nếu hợp lệ, không thì suy ra từ MIME.
function ext(mimeType, originalName = '') {
  const fromOriginal = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '');
  return fromOriginal || MIME_TO_EXT[mimeType] || '';
}

/**
 * Sinh object key theo UUID. Tên file client gửi lên KHÔNG BAO GIỜ được dùng
 * làm key — tránh path traversal và ghi đè file của người khác.
 */
export const StorageKeyBuilder = {
  /** {folder}/{uuid}.jpg — folder phải nằm trong IMAGE_FOLDERS */
  image(folder, mimeType, originalName = '') {
    if (!IMAGE_FOLDERS.includes(folder)) {
      throw new Error(`Thư mục ảnh không hợp lệ: ${folder}`);
    }
    return `${folder}/${randomUUID()}${ext(mimeType, originalName)}`;
  },
};
