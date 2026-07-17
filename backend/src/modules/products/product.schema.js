import { z } from 'zod';

export const createProductSchema = z.object({
  name:        z.string().min(1).max(200),
  type:        z.string().min(1).max(100),
  price:       z.coerce.number().int().positive(),
  categoryId:  z.coerce.number().int().positive(),
  img:         z.string().optional().default('/images/placeholder.jpg'),
  stock:       z.coerce.number().int().nonnegative().optional().default(0),
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
  categoryId:z.coerce.number().int().positive().optional(),
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

export const createFlashSaleSchema = z.object({
  productId:     z.coerce.number().int().positive(),
  price:         z.coerce.number().int().positive(),
  originalPrice: z.coerce.number().int().positive(),
  stock:         z.coerce.number().int().nonnegative().optional().default(0),
  sold:          z.coerce.number().int().nonnegative().optional().default(0),
  startsAt:      z.string().optional(),
  endsAt:        z.string().nullable().optional(),
  active:        z.boolean().optional().default(true),
});

export const updateFlashSaleSchema = createFlashSaleSchema.partial();
