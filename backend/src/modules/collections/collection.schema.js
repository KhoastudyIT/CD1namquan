import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Tên bộ sưu tập là bắt buộc'),
  img:  z.string().trim().min(1, 'Ảnh bộ sưu tập là bắt buộc'),
});

export const updateCollectionSchema = createCollectionSchema.partial();
