import { z } from 'zod';

/** Số ngày lấy mặc định khi người dùng không chọn khoảng thời gian. */
export const DEFAULT_REPORT_DAYS = 30;

/** Trang Tổng quan cũng mặc định 30 ngày, để hai chỗ khớp nhau. */
export const DEFAULT_OVERVIEW_DAYS = 30;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD');

export const reportQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
}).refine(
  v => !(v.from && v.to) || v.from <= v.to,
  { message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc' },
);
