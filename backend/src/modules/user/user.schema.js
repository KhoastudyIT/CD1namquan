import { z } from 'zod';

// Giá trị phải khớp ràng buộc CHECK của bảng users, nếu không Postgres chặn ở
// tầng DB và người dùng chỉ nhận được lỗi 500 khó hiểu:
//   role   IN ('customer','staff','manager','admin','super_admin')
//   status IN ('active','inactive','blocked')
const assignableRole = z.enum(['customer', 'staff', 'admin']);
const accountStatus  = z.enum(['active', 'blocked']);

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  // "staff,admin" → ['staff','admin']; trang Nhân viên cần lọc nhiều vai trò
  // cùng lúc, còn trang Khách hàng chỉ lấy customer.
  role: z.string().trim().optional().transform((val, ctx) => {
    if (!val) return undefined;
    const roles = val.split(',').map(r => r.trim()).filter(Boolean);
    for (const r of roles) {
      if (!assignableRole.options.includes(r)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Vai trò không hợp lệ: ${r}` });
        return z.NEVER;
      }
    }
    return roles;
  }),
  status: accountStatus.optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  phone:    z.string().max(20).regex(/^[0-9+\-\s]*$/, 'Số điện thoại không hợp lệ').optional().default(''),
  password: z.string().min(6).max(100),
  // Bỏ trống thì mặc định tạo tài khoản nhân viên — đây là mục đích chính của
  // tuyến này; muốn tạo admin phải chỉ định rõ.
  role:     assignableRole.default('staff'),
});

export const updateRoleSchema = z.object({
  role: assignableRole,
});

export const updateStatusSchema = z.object({
  status: accountStatus,
});
