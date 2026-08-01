/**
 * Hằng số dùng chung cho lớp lưu trữ đối tượng (MinIO / S3).
 * Port từ thilaixe_backend, rút gọn theo nhu cầu của NAM QUAN:
 * hiện chỉ có tài sản công khai (ảnh bài viết) nên không tách bucket private.
 */

/**
 * Thư mục ảnh hợp lệ. Client chỉ được chọn trong danh sách này — không tự đặt
 * đường dẫn, tránh ghi ra ngoài vùng cho phép.
 */
export const IMAGE_FOLDERS = ['news', 'products', 'categories', 'collections'];

// Key có tiền tố nằm trong danh sách này mới được phép sinh URL công khai.
export const PUBLIC_KEY_PREFIXES = IMAGE_FOLDERS.map(folder => `${folder}/`);

// Chặn cứng các MIME nguy hiểm trước khi xét allowlist theo từng loại tài sản.
export const BLOCKED_MIMES = new Set([
  'application/x-executable',
  'application/x-msdownload',
  'application/x-sh',
  'text/x-script.python',
  'application/javascript',
  'text/javascript',
  'application/x-httpd-php',
  'application/x-perl',
]);

export const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

export const DEFAULT_UPLOAD_URL_TTL = 3600; // 1 giờ
export const DEFAULT_VIEW_URL_TTL   = 900;  // 15 phút
