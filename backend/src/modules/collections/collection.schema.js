import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  img: z.string().optional().default('/images/placeholder.jpg'),
});

export const updateCollectionSchema = createCollectionSchema.partial();
