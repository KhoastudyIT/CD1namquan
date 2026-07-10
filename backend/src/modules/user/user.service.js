import { users, orders } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

/** Strip the password hash before a user leaves the service layer. */
function sanitize(user) {
  const { password: _pw, ...safe } = user;
  return safe;
}

/** Admin: paginated, searchable user list with order counts attached. */
export function listUsers({ search, role, status, page = 1, limit = 20 }) {
  let items = [...users.values()];

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  if (role)   items = items.filter(u => u.role === role);
  if (status) items = items.filter(u => (u.status ?? 'active') === status);

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const orderCount = new Map();
  for (const o of orders.values()) {
    orderCount.set(o.userId, (orderCount.get(o.userId) ?? 0) + 1);
  }

  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const data = items
    .slice((page - 1) * limit, page * limit)
    .map(u => ({ ...sanitize(u), status: u.status ?? 'active', orderCount: orderCount.get(u.id) ?? 0 }));

  return { data, meta: { total, page, limit, totalPages } };
}

export function getUser(id) {
  const user = users.get(id);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  return { ...sanitize(user), status: user.status ?? 'active' };
}

/** Admin: promote/demote a user. Cannot change your own role. */
export function updateUserRole(actorId, id, role) {
  if (actorId === id) throw new AppError('Bạn không thể tự thay đổi quyền của chính mình', 400);
  const user = users.get(id);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);

  user.role = role;
  users.set(id, user);
  return { ...sanitize(user), status: user.status ?? 'active' };
}

/** Admin: suspend/reactivate a user. Cannot suspend yourself. */
export function updateUserStatus(actorId, id, status) {
  if (actorId === id) throw new AppError('Bạn không thể tự khóa tài khoản của chính mình', 400);
  const user = users.get(id);
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);

  user.status = status;
  users.set(id, user);
  return { ...sanitize(user), status };
}
