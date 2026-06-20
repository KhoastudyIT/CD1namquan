import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { users } from './store.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@namquan.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

/**
 * Seed a default admin account so the admin dashboard is reachable.
 * Registration only ever creates `customer` accounts, so without this
 * there would be no way to obtain an admin token.
 */
export async function seedAdmin() {
  const exists = [...users.values()].some(u => u.email === ADMIN_EMAIL);
  if (exists) return;

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = {
    id: randomUUID(),
    name: 'Quản trị viên',
    email: ADMIN_EMAIL,
    password: hashed,
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  users.set(admin.id, admin);

  console.log(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}
