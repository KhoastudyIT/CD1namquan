import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  img: z.string().optional().default('/images/placeholder.jpg'),
});

export const updateCategorySchema = createCategorySchema.partial();
