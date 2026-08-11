import { z } from 'zod';

export const CONSULTATION_STATUSES = ['new', 'contacted', 'quoted', 'closed', 'cancelled'];

const optionalText = (max) => z.string().trim().max(max).optional().default('');

const phoneField = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số điện thoại')
  .transform(v => v.replace(/[\s.\-()]/g, ''))
  .refine(v => /^\+?\d{9,15}$/.test(v), 'Số điện thoại không hợp lệ');

const optionalEmail = z
  .string()
  .trim()
  .max(255, 'Email tối đa 255 ký tự')
  .refine(v => v === '' || z.string().email().safeParse(v).success, 'Email không hợp lệ')
  .optional()
  .default('');

// ── Body ─────────────────────────────────────────────────────────────────────

export const createConsultationSchema = z.object({
  name: z.string().trim().min(2, 'Vui lòng nhập họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  phone: phoneField,
  email: optionalEmail,

  serviceType: optionalText(100),
  propertyType: optionalText(100),
  area: optionalText(100),
  budget: optionalText(100),
  address: optionalText(500),
  message: optionalText(2000),
});

export const updateConsultationStatusSchema = z.object({
  status: z.enum(CONSULTATION_STATUSES, {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' }),
  }),
});

// ── Query ────────────────────────────────────────────────────────────────────

export const consultationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(CONSULTATION_STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});
