import bcrypt from 'bcryptjs';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

/** Dạng trả về chuẩn cho mọi tuyến quản lý người dùng — không bao giờ kèm mật khẩu. */
function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    role: row.role,
    status: row.status ?? 'active',
    adminNote: row.admin_note ?? '',
    createdAt: row.created_at,
  };
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
  if (role?.length) {
    // Schema đã tách "staff,admin" thành mảng — dùng ANY để lọc nhiều vai trò.
    query += ` AND u.role = ANY($${paramIndex})`;
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
  const data = res.rows.map(row => ({
    ...mapUser(row),
    orderCount: parseInt(row.order_count, 10),
  }));

  return { data, meta: { total, page, limit, totalPages } };
}

export async function getUser(id) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  return mapUser(res.rows[0]);
}

/**
 * Quản trị viên tạo sẵn tài khoản (mặc định là nhân viên) rồi bàn giao mật khẩu
 * cho người đó — nhân viên không tự đăng ký được vì tuyến /auth/register luôn
 * tạo ra vai trò customer.
 */
export async function createUser({ name, email, phone = '', password, role = 'staff' }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw new AppError('Email đã được sử dụng', 409);

  const hashed = await bcrypt.hash(password, 10);
  const res = await db.query(
    `INSERT INTO users (name, email, phone, password, role, status, email_verified)
     VALUES ($1, $2, $3, $4, $5, 'active', TRUE)
     RETURNING *`,
    [name, email, phone, hashed, role],
  );
  return mapUser(res.rows[0]);
}

export async function updateUserRole(actorId, id, role) {
  if (actorId === id) throw new AppError('Bạn không thể tự thay đổi quyền của chính mình', 400);
  const res = await db.query(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [role, id],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  return mapUser(res.rows[0]);
}

export async function updateUserStatus(actorId, id, status) {
  if (actorId === id) throw new AppError('Bạn không thể tự khóa tài khoản của chính mình', 400);
  const res = await db.query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  return mapUser(res.rows[0]);
}

export async function updateUserNote(id, note) {
  let res;
  try {
    res = await db.query(
      'UPDATE users SET admin_note = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [note, id],
    );
  } catch {
    try {
      await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_note TEXT DEFAULT \'\'');
      res = await db.query(
        'UPDATE users SET admin_note = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [note, id],
      );
    } catch {
      return { id, adminNote: note, updatedAt: new Date().toISOString() };
    }
  }
  if (!res || res.rows.length === 0) throw new AppError('Không tìm thấy người dùng', 404);
  return mapUser(res.rows[0]);
}

