import bcrypt from 'bcryptjs';
import db from './index.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@namquan.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

/**
 * Seed a default admin account so the admin dashboard is reachable.
 * Registration only ever creates `customer` accounts, so without this
 * there would be no way to obtain an admin token.
 */
export async function seedAdmin() {
  const check = await db.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
  if (check.rows.length > 0) {
    console.log(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.query(
    'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
    ['Quản trị viên', ADMIN_EMAIL, hashed, 'admin', 'active']
  );

  console.log(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}
