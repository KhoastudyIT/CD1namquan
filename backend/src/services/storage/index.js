import { storageConfig } from '../../config/storage.config.js';
import { MinioStorage } from './minio.js';
import { LocalStorage } from './local.js';

export const isMinioEnabled = storageConfig.enabled;
export const storageEnabled = true;

export const storage = isMinioEnabled ? new MinioStorage(storageConfig) : new LocalStorage();

/** Dùng trong controller: đảm bảo storage sẵn sàng. */
export function requireStorage() {
  return storage;
}

/**
 * Khởi tạo kho lưu trữ lúc boot (MinIO hoặc LocalStorage).
 */
export async function bootstrapStorage() {
  try {
    await storage.bootstrap();
    if (isMinioEnabled) {
      console.log(`  Lưu trữ ảnh: MinIO bucket "${storageConfig.publicBucket}" sẵn sàng`);
    } else {
      console.log(`  Lưu trữ ảnh: Chế độ LocalStorage (lưu trực tiếp trong thư mục backend/uploads) sẵn sàng`);
    }
  } catch (err) {
    console.warn(`  Lưu trữ ảnh: không thể khởi tạo — ${err.message}`);
  }
}

export { StorageKeyBuilder } from './key-builder.js';
export { MimeValidator, MAX_IMAGE_BYTES } from './mime-validator.js';
export { IMAGE_FOLDERS } from './constants.js';
