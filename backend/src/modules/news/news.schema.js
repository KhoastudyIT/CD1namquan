import { z } from 'zod';

export const createNewsSchema = z.object({
  title:   z.string().trim().min(1, 'Tiêu đề là bắt buộc'),
  img:     z.string().trim().min(1, 'Ảnh bài viết là bắt buộc'),
  excerpt: z.string().trim().min(1, 'Mô tả ngắn là bắt buộc'),
  content: z.string().trim().min(1, 'Nội dung là bắt buộc'),
  date:    z.string().trim().optional(),
});

export const updateNewsSchema = createNewsSchema.partial();
