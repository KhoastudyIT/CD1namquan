import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity:  z.number().int().positive().optional().default(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
});
