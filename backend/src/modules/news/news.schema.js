import { z } from 'zod';

export const NEWS_STATUSES = ['draft', 'published', 'hidden'];
export const NEWS_SORTS    = ['newest', 'oldest', 'popular'];

// Query param dạng chuỗi 'true'/'false' → boolean. Không truyền = không lọc.
const boolParam = z
  .enum(['true', 'false'])
  .optional()
  .transform(v => (v === undefined ? undefined : v === 'true'));

// ── Query danh sách ──────────────────────────────────────────────────────────

export const newsListQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(9),
  search:   z.string().trim().max(200).optional(),
  category: z.string().trim().max(140).optional(), // slug danh mục
  tag:      z.string().trim().max(60).optional(),
  featured: boolParam,
  sort:     z.enum(NEWS_SORTS).default('newest'),
});

export const adminNewsListQuerySchema = newsListQuerySchema.extend({
  limit:  z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(NEWS_STATUSES).optional(),
});

export const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(3),
});

// ── Body ─────────────────────────────────────────────────────────────────────

export const createNewsSchema = z.object({
  title:   z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(500, 'Tiêu đề tối đa 500 ký tự'),
  slug:    z.string().trim().max(550)
            .regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang')
            .optional(),
  img:     z.string().trim().min(1, 'Ảnh bìa là bắt buộc').max(500),
  excerpt: z.string().trim().min(1, 'Mô tả ngắn là bắt buộc').max(500, 'Mô tả ngắn tối đa 500 ký tự'),
  content: z.string().trim().min(1, 'Nội dung là bắt buộc').max(100_000),

  author:     z.string().trim().max(100).optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  tags:       z.array(z.string().trim().min(1).max(60)).max(10, 'Tối đa 10 thẻ').optional(),
  status:     z.enum(NEWS_STATUSES).optional(),
  featured:   z.boolean().optional(),

  // Chấp nhận cả 'dd/mm/yyyy' và 'yyyy-mm-dd'. Bỏ trống = ngày hiện tại.
  date: z.string().trim().max(30).optional(),

  seoTitle:       z.string().trim().max(255, 'SEO title tối đa 255 ký tự').optional(),
  seoDescription: z.string().trim().max(500, 'SEO description tối đa 500 ký tự').optional(),
  seoKeywords:    z.string().trim().max(500).optional(),
  ogImage:        z.string().trim().max(500).optional(),
});

export const updateNewsSchema = createNewsSchema
  .partial()
  .refine(obj => Object.keys(obj).length > 0, {
    message: 'Vui lòng cung cấp ít nhất một trường cần cập nhật',
  });

export const updateNewsStatusSchema = z.object({
  status: z.enum(NEWS_STATUSES, { errorMap: () => ({ message: 'Trạng thái không hợp lệ' }) }),
});
