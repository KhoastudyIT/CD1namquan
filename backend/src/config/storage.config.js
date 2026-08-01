import { z } from 'zod';
import { DEFAULT_UPLOAD_URL_TTL, DEFAULT_VIEW_URL_TTL } from '../services/storage/constants.js';

const minioSchema = z.object({
  endpoint:     z.string().min(1, 'MINIO_ENDPOINT là bắt buộc khi bật lưu trữ ảnh'),
  publicUrl:    z.string().min(1, 'MINIO_PUBLIC_URL là bắt buộc khi bật lưu trữ ảnh'),
  accessKey:    z.string().min(1, 'MINIO_ACCESS_KEY là bắt buộc khi bật lưu trữ ảnh'),
  secretKey:    z.string().min(1, 'MINIO_SECRET_KEY là bắt buộc khi bật lưu trữ ảnh'),
  publicBucket: z.string().min(1),
  uploadUrlTtl: z.number().int().positive(),
  viewUrlTtl:   z.number().int().positive(),
  corsOrigins:  z.string().default('*'),
});

/**
 * Khác với thilaixe (fail-fast vì storage là bắt buộc), ở đây storage là tính năng
 * tùy chọn: thiếu cấu hình thì `enabled = false`, backend vẫn chạy bình thường và
 * chỉ riêng endpoint xin URL upload trả 503 kèm lý do.
 */
function parseStorageConfig() {
  const raw = {
    endpoint:     process.env.MINIO_ENDPOINT   ?? '',
    publicUrl:    process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? '',
    accessKey:    process.env.MINIO_ACCESS_KEY ?? '',
    secretKey:    process.env.MINIO_SECRET_KEY ?? '',
    publicBucket: process.env.MINIO_PUBLIC_BUCKET ?? 'namquan',
    corsOrigins:  process.env.STORAGE_CORS_ORIGINS ?? '*',
    uploadUrlTtl: parseInt(process.env.STORAGE_UPLOAD_URL_TTL ?? String(DEFAULT_UPLOAD_URL_TTL), 10),
    viewUrlTtl:   parseInt(process.env.STORAGE_VIEW_URL_TTL   ?? String(DEFAULT_VIEW_URL_TTL), 10),
  };

  // Chưa khai báo gì cả → coi như chưa bật, không cần báo lỗi.
  if (!raw.endpoint && !raw.accessKey && !raw.secretKey) {
    return { enabled: false, reason: 'Chưa cấu hình MinIO (thiếu MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY)' };
  }

  const result = minioSchema.safeParse(raw);
  if (!result.success) {
    // Khai báo dở dang → nêu đúng biến còn thiếu thay vì im lặng bỏ qua.
    const issues = result.error.issues.map(i => `${i.path.join('.') || 'root'}: ${i.message}`).join('; ');
    return { enabled: false, reason: `Cấu hình MinIO không hợp lệ — ${issues}` };
  }

  return { enabled: true, ...result.data };
}

export const storageConfig = parseStorageConfig();
