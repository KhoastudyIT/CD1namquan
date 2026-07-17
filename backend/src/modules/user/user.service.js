import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

export async function listUsers({ search, role, status, page = 1, limit = 20 }) {
  let query = `
    SELECT u.*, COUNT(o.id) as order_count
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (role) {
    query += ` AND u.role = $${paramIndex}`;
    params.push(role);
    paramIndex++;
  }
  if (status) {
    query += ` AND COALESCE(u.status, 'active') = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

  const totalRes = await db.query(`SELECT COUNT(*) FROM (${query}) as t`, params);
  const total = parseInt(totalRes.rows[0].count, 10);
  const totalPages = Math.ceil(total / limit) || 1;

  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, (page - 1) * limit);

  const res = await db.query(query, params);
  const data = res.rows.map(row => {
    const user = {
      id: row.id, name: row.name, email: row.email, role: row.role, status: row.status ?? 'active',
      createdAt: row.created_at
    };
    return { ...user, orderCount: parseInt(row.order_count, 10) };
  });

  return { data, meta: { total, page, limit, totalPages } };
}

export async function getUser(id) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  const user = res.rows[0];
  return { 
    id: user.id, name: user.name, email: user.email, role: user.role, status: user.status ?? 'active',
    createdAt: user.created_at
  };
}

export async function updateUserRole(actorId, id, role) {
  if (actorId === id) throw new AppError('Bạn không thể tự thay đổi quyền của chính mình', 400);
  const res = await db.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', [role, id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  const user = res.rows[0];
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status ?? 'active' };
}

export async function updateUserStatus(actorId, id, status) {
  if (actorId === id) throw new AppError('Bạn không thể tự khóa tài khoản của chính mình', 400);
  const res = await db.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  const user = res.rows[0];
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status ?? 'active' };
}

