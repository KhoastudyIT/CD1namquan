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

export async function register({ name, email, password }) {
  const check = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (check.rows.length > 0) throw new AppError('Email đã được đăng ký', 409);

  const hashed = await bcrypt.hash(password, 10);
  const res = await db.query(
    'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, email, hashed, 'customer', 'active']
  );
  const user = res.rows[0];

  await createNotification(user.id, {
    type: 'welcome',
    title: 'Chào mừng đến với NAM QUAN! 🎉',
    message: 'Cảm ơn bạn đã đăng ký tài khoản. Khám phá bộ sưu tập nội thất cao cấp của chúng tôi ngay hôm nay.',
    link: '/shop',
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  
  return { user: mapUser(user), token };
}

export async function login({ email, password }) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = res.rows[0];
  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  if (user.status === 'suspended') throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  
  return { user: mapUser(user), token };
}

export async function getMe(userId) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = res.rows[0];
  if (!user) throw new AppError('User not found', 404);

  return mapUser(user);
}

export async function updateProfile(userId, { name, phone }) {
  const res = await db.query(
    'UPDATE users SET name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [name, phone, userId],
  );
  const user = res.rows[0];
  if (!user) throw new AppError('User not found', 404);

  return mapUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const res = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
  const row = res.rows[0];
  if (!row) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, row.password);
  if (!valid) throw new AppError('Mật khẩu hiện tại không đúng', 400);

  // Đổi sang đúng mật khẩu cũ thì coi như không đổi — báo rõ thay vì im lặng.
  const unchanged = await bcrypt.compare(newPassword, row.password);
  if (unchanged) throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400);

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, userId]);
}
