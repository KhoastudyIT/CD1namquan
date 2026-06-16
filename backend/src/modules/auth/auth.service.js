import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../../config/index.js';
import { users } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function register({ name, email, password }) {
  const existing = [...users.values()].find(u => u.email === email);
  if (existing) throw new AppError('Email đã được đăng ký', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    name,
    email,
    password: hashed,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function login({ email, password }) {
  const user = [...users.values()].find(u => u.email === email);
  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Email hoặc mật khẩu không đúng', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
}

export function getMe(userId) {
  const user = users.get(userId);
  if (!user) throw new AppError('User not found', 404);
  const { password: _, ...safeUser } = user;
  return safeUser;
}
