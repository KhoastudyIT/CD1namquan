import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(2000, 'Tin nhắn tối đa 2000 ký tự'),
  // Sản phẩm khách đang xem khi mở khung chat — giúp bot hiểu "cái này" là gì.
  productId: z.coerce.number().int().positive().nullable().optional(),
});

export const staffReplySchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Nội dung tin nhắn không được để trống')
    .max(2000, 'Tin nhắn tối đa 2000 ký tự'),
});

export const updateConversationSchema = z.object({
  aiEnabled: z.boolean().optional(),
  status: z.enum(['open', 'closed']).optional(),
}).refine(
  (data) => data.aiEnabled !== undefined || data.status !== undefined,
  { message: 'Cần ít nhất một trường để cập nhật' },
);
