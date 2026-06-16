import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(10).max(500),
  note:            z.string().max(500).optional().default(''),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity:  z.number().int().positive(),
  })).min(1),
});
