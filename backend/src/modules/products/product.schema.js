import { z } from 'zod';

export const createProductSchema = z.object({
  name:        z.string().min(1).max(200),
  type:        z.string().min(1).max(100),
  price:       z.number().int().positive(),
  category:    z.string().min(1).max(100),
  img:         z.string().optional().default('/images/placeholder.jpg'),
  stock:       z.number().int().nonnegative().optional().default(0),
  description: z.string().max(1000).optional().default(''),
  colors:      z.array(z.string()).optional().default([]),
  style:       z.string().optional().default(''),
  materials:   z.array(z.string()).optional().default([]),
  sizes:       z.array(z.string()).optional().default([]),
  brand:       z.string().optional().default(''),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  category:  z.string().optional(),
  type:      z.string().optional(),
  search:    z.string().optional(),
  sort:      z.enum(['price_asc', 'price_desc', 'rating', 'sold', 'newest']).optional().default('newest'),
  page:      z.coerce.number().int().positive().optional().default(1),
  limit:     z.coerce.number().int().positive().max(100).optional().default(12),
  priceMin:  z.coerce.number().nonnegative().optional(),
  priceMax:  z.coerce.number().positive().optional(),
  colors:    z.string().optional(),
  styles:    z.string().optional(),
  materials: z.string().optional(),
  sizes:     z.string().optional(),
  brands:    z.string().optional(),
});
