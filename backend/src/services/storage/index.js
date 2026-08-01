import { storageConfig } from '../../config/storage.config.js';
import { MinioStorage } from './minio.js';
import { AppError } from '../../middleware/errorHandler.js';

export const storageEnabled = storageConfig.enabled;

export const storage = storageEnabled ? new MinioStorage(storageConfig) : null;

/** Dùng trong controller: đảm bảo storage sẵn sàng, không thì 503 kèm lý do rõ ràng. */
export function requireStorage() {
  if (!storage) {
    throw new AppError(
      `Tính năng tải ảnh chưa khả dụng. ${storageConfig.reason}. Xem hướng dẫn trong backend/README.md.`,
      503,
    );
  }
  return storage;
}

/**
 * Khởi tạo bucket lúc boot. Cố ý KHÔNG throw: MinIO chưa chạy thì backend vẫn
 * phục vụ được toàn bộ API còn lại, chỉ riêng upload ảnh là chưa dùng được.
 */
export async function bootstrapStorage() {
  if (!storage) {
    console.log(`  Lưu trữ ảnh: TẮT — ${storageConfig.reason}`);
    return;
  }
  try {
    await storage.bootstrap();
    console.log(`  Lưu trữ ảnh: MinIO bucket "${storageConfig.publicBucket}" sẵn sàng`);
  } catch (err) {
    console.warn(`  Lưu trữ ảnh: không kết nối được MinIO — ${err.message}`);
  }
}

export { StorageKeyBuilder } from './key-builder.js';
export { MimeValidator, MAX_IMAGE_BYTES } from './mime-validator.js';
export { IMAGE_FOLDERS } from './constants.js';
