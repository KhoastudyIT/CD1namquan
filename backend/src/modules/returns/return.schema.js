import { z } from 'zod';

export const RETURN_TYPES = ['return', 'exchange'];
export const RETURN_STATUSES = ['pending', 'approved', 'rejected', 'completed'];

export const MIN_RETURN_IMAGES = 2;
export const MAX_RETURN_IMAGES = 5;

/** Nhãn tiếng Việt dùng chung cho thông báo trả về client. */
export const RETURN_TYPE_LABEL = {
  return:   'Trả hàng',
  exchange: 'Đổi hàng',
};

export const RETURN_STATUS_LABEL = {
  pending:   'Chờ duyệt',
  approved:  'Đã duyệt',
  rejected:  'Từ chối',
  completed: 'Hoàn tất',
};

// ── Vòng đời yêu cầu: CHỈ ĐI TỚI, KHÔNG LÙI ─────────────────────────────────
//
//   pending ──▶ approved ──▶ completed
//      └───────────┴──▶ rejected
//
// Giống quy trình xử lý yêu cầu tư vấn: đã duyệt rồi thì không quay lại "chờ
// duyệt" được, và completed/rejected là chốt sổ. Ràng buộc này quan trọng hơn ở
// đây vì bước completed có đụng tới kho và tiền — cho lùi rồi tiến lại sẽ hoàn
// kho hai lần.
export const RETURN_FLOW = {
  pending:   ['approved', 'rejected'],
  approved:  ['completed', 'rejected'],
  rejected:  [],
  completed: [],
};

/** Yêu cầu đang mở = chờ duyệt hoặc đã duyệt nhưng chưa xử lý xong. */
export const RETURN_OPEN_STATUSES = ['pending', 'approved'];

export const canTransitionReturn = (from, to) => (RETURN_FLOW[from] ?? []).includes(to);

// ── Body ─────────────────────────────────────────────────────────────────────

export const createReturnSchema = z.object({
  orderId: z.string().uuid('Mã đơn hàng không hợp lệ'),
  type: z.enum(RETURN_TYPES, {
    errorMap: () => ({ message: 'Chỉ nhận yêu cầu trả hàng hoặc đổi hàng' }),
  }),
  reason: z.string()
    .trim()
    .min(10, 'Vui lòng mô tả lý do ít nhất 10 ký tự')
    .max(500, 'Lý do tối đa 500 ký tự'),
  // Ảnh minh hoạ tình trạng hàng — BẮT BUỘC ít nhất 2 tấm để cửa hàng có đủ căn
  // cứ đối chiếu với lý do (thường cần một ảnh toàn cảnh và một ảnh cận chỗ lỗi).
  // Chỉ nhận key do chính API upload sinh ra (thư mục returns/), không nhận URL
  // ngoài — tránh biến trang quản trị thành nơi nhúng ảnh lạ.
  images: z.array(
    z.string().trim().regex(/^returns\/[\w.-]+$/, 'Đường dẫn ảnh không hợp lệ'),
  )
    .min(MIN_RETURN_IMAGES, `Vui lòng đính kèm ít nhất ${MIN_RETURN_IMAGES} ảnh sản phẩm`)
    .max(MAX_RETURN_IMAGES, `Chỉ đính kèm tối đa ${MAX_RETURN_IMAGES} ảnh`),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(RETURN_STATUSES, {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' }),
  }).optional(),
  adminNote: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
}).refine(v => v.status !== undefined || v.adminNote !== undefined, {
  message: 'Cần ít nhất một trong hai: trạng thái mới hoặc ghi chú',
});

// ── Query ────────────────────────────────────────────────────────────────────

export const returnQuerySchema = z.object({
  status: z.enum(RETURN_STATUSES).optional(),
  type:   z.enum(RETURN_TYPES).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(15),
});
