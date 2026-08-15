import { z } from 'zod';

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD');

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

/** Bộ lọc của trang Quản lý đơn hàng (GET /orders/admin/list). */
export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  // Tìm theo mã đơn, tên hoặc email khách, và địa chỉ giao hàng.
  search: z.string().trim().max(100).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
}).refine(
  v => !(v.from && v.to) || v.from <= v.to,
  { message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc' },
);

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(10).max(500),
  phone: z.string().max(20).optional().default(''),
  note: z.string().max(500).optional().default(''),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
});
