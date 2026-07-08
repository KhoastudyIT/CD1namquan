import { users } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

/** Loại bỏ password trước khi trả về client */
function safe(user) {
  const { password: _, ...rest } = user;
  return rest;
}

/**
 * Lấy danh sách user có filter + phân trang (admin only).
 * @param {object} params - { search, role, status, page, limit }
 */
export function listUsers({ search = '', role = '', status = '', page = 1, limit = 10 } = {}) {
  let list = [...users.values()];

  // Search theo name hoặc email
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  // Lọc theo role
  if (role) {
    list = list.filter(u => u.role === role);
  }

  // Lọc theo status (active / suspended)
  if (status) {
    list = list.filter(u => (u.status || 'active') === status);
  }

  // Sắp xếp: mới nhất trước
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const p = Math.max(1, Math.min(page, totalPages));
  const start = (p - 1) * limit;
  const data = list.slice(start, start + limit).map(safe);

  return { data, meta: { total, page: p, limit, totalPages } };
}

/**
 * Lấy chi tiết một user (admin only).
 */
export function getUserById(id) {
  const user = users.get(id);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  return safe(user);
}

/**
 * Cập nhật role của user.
 * Admin không thể tự đổi role của chính mình.
 */
export function updateUserRole(targetId, newRole, requesterId) {
  if (targetId === requesterId) {
    throw new AppError('Không thể tự đổi quyền của chính mình', 400);
  }
  const user = users.get(targetId);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  if (!['customer', 'admin'].includes(newRole)) {
    throw new AppError('Role không hợp lệ', 422);
  }
  user.role = newRole;
  users.set(targetId, user);
  return safe(user);
}

/**
 * Khóa / mở khóa tài khoản.
 * Admin không thể tự khóa chính mình.
 */
export function updateUserStatus(targetId, newStatus, requesterId) {
  if (targetId === requesterId) {
    throw new AppError('Không thể tự khóa tài khoản của chính mình', 400);
  }
  const user = users.get(targetId);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  if (!['active', 'suspended'].includes(newStatus)) {
    throw new AppError('Status không hợp lệ', 422);
  }
  user.status = newStatus;
  users.set(targetId, user);
  return safe(user);
}
