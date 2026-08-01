import { imageUploadUrlSchema } from './upload.schema.js';
import { requireStorage, StorageKeyBuilder, MimeValidator } from '../../services/storage/index.js';
import { ok } from '../../utils/response.js';

/**
 * POST /uploads/image-url
 *
 * Trả URL PUT có chữ ký để dashboard đẩy file thẳng lên MinIO — ảnh không đi qua
 * backend, đỡ tốn băng thông và bộ nhớ của API. Dùng chung cho ảnh bài viết,
 * sản phẩm, danh mục và bộ sưu tập.
 */
export async function getImageUploadUrl(req, res, next) {
  try {
    const store = requireStorage();
    const { type, mimeType, size, originalName } = imageUploadUrlSchema.parse(req.body);
    MimeValidator.assertImage(mimeType, size);

    // Key do server sinh (UUID) — không dùng tên file client gửi lên.
    const objectKey = StorageKeyBuilder.image(type, mimeType, originalName);
    const uploadUrl = await store.getSignedUrl(objectKey, { method: 'PUT', contentType: mimeType });

    ok(res, { uploadUrl, objectKey, publicUrl: store.getPublicUrl(objectKey) });
  } catch (error) {
    next(error);
  }
}
