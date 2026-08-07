import { z } from 'zod';

export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name:  z.string().min(2).max(100),
  // Cột phone NOT NULL DEFAULT '' nên cho phép bỏ trống, chỉ chặn ký tự lạ.
  phone: z.string().max(20).regex(/^[0-9+\-\s]*$/, 'Số điện thoại không hợp lệ').optional().default(''),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6).max(100),
});
