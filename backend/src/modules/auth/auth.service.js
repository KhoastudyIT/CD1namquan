import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';

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
  
  delete user.password;
  return { user, token };
}

export async function login({ email, password }) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = res.rows[0];
  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  
  delete user.password;
  return { user, token };
}

export async function getMe(userId) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = res.rows[0];
  if (!user) throw new AppError('User not found', 404);
  
  delete user.password;
  return user;
}
