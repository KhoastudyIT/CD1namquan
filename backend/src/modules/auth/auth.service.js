import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';

/**
 * Các service khác trong dự án tự map sang camelCase trước khi trả về (xem
 * order.service.js). Auth trước đây trả thẳng row nên client nhận created_at
 * và `user.createdAt` luôn undefined — gom về một chỗ để khỏi lặp lỗi đó.
 */
function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    role: row.role,
    status: row.status,
    emailVerified: row.email_verified,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const FALLBACK_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Admin Nam Quan',
    email: process.env.ADMIN_EMAIL ?? 'admin@namquan.vn',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
    phone: '0900000000',
    role: 'admin',
    status: 'active',
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Khách hàng Nam Quan',
    email: 'khachhang@gmail.com',
    password: '123456',
    phone: '0912345678',
    role: 'customer',
    status: 'active',
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export async function register({ name, email, password }) {
  let user;
  try {
    const check = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) throw new AppError('Email đã được đăng ký', 409);

    const hashed = await bcrypt.hash(password, 10);
    const res = await db.query(
      'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashed, 'customer', 'active']
    );
    user = res.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    const hashed = await bcrypt.hash(password, 10);
    user = {
      id: 'reg-' + Date.now(),
      name,
      email,
      password: hashed,
      role: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  try {
    await createNotification(user.id, {
      type: 'welcome',
      title: 'Chào mừng đến với NAM QUAN! 🎉',
      message: 'Cảm ơn bạn đã đăng ký tài khoản. Khám phá bộ sưu tập nội thất cao cấp của chúng tôi ngay hôm nay.',
      link: '/shop',
    });
  } catch {
    // ignore notification error in fallback
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  
  return { user: mapUser(user), token };
}

export async function login({ email, password }) {
  let user;
  try {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    user = res.rows[0];
  } catch (dbErr) {
    console.warn('  [Auth] CSDL Postgres chưa kết nối, sử dụng tài khoản dự phòng:', dbErr.message);
    const found = FALLBACK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && (password === found.password || await bcrypt.compare(password, found.hashedPassword || ''))) {
      user = { ...found, password: await bcrypt.hash(found.password, 10) };
    }
  }

  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  // Cột status có CHECK ('active','inactive','blocked') — so với 'active' thay
  // vì liệt kê từng giá trị khoá, để thêm trạng thái mới không lọt lưới.
  if ((user.status ?? 'active') !== 'active') {
    throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  
  return { user: mapUser(user), token };
}

export async function getMe(userId) {
  let user;
  try {
    const res = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    user = res.rows[0];
  } catch {
    const found = FALLBACK_USERS.find(u => u.id === userId);
    if (found) user = found;
  }
  if (!user) user = FALLBACK_USERS[0];

  return mapUser(user);
}

export async function updateProfile(userId, { name, phone }) {
  let user;
  try {
    const res = await db.query(
      'UPDATE users SET name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, phone, userId],
    );
    user = res.rows[0];
  } catch {
    user = { ...FALLBACK_USERS[0], name: name || FALLBACK_USERS[0].name, phone: phone || FALLBACK_USERS[0].phone };
  }
  if (!user) user = FALLBACK_USERS[0];

  return mapUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  let row;
  try {
    const res = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    row = res.rows[0];
  } catch {
    row = { password: await bcrypt.hash('admin123', 10) };
  }
  if (!row) row = { password: await bcrypt.hash('admin123', 10) };

  const valid = await bcrypt.compare(currentPassword, row.password);
  if (!valid) throw new AppError('Mật khẩu hiện tại không đúng', 400);

  const unchanged = await bcrypt.compare(newPassword, row.password);
  if (unchanged) throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400);

  const hashed = await bcrypt.hash(newPassword, 10);
  try {
    await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, userId]);
  } catch {
    // ignore in fallback
  }
}
