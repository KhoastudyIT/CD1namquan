import { z } from 'zod';

export const createNewsSchema = z.object({
  title: z.string().min(1).max(200),
  img: z.string().optional().default('/images/placeholder.jpg'),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  date: z.string().optional(),
});

export const updateNewsSchema = createNewsSchema.partial();
