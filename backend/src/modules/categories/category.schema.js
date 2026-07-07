import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục là bắt buộc'),
  img:  z.string().trim().min(1, 'Ảnh danh mục là bắt buộc'),
});

export const updateCategorySchema = createCategorySchema.partial();
