import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role:   z.enum(['customer', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

export const updateRoleSchema = z.object({
  role: z.enum(['customer', 'admin']),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});
