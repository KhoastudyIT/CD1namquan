import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import db from './index.js';

import { users, userAddresses } from './data/users.js';
import { categories, collections, brands } from './data/categories.js';
import { products, productSpecs, productImages, tags, productTags } from './data/products.js';
import { flashSales, coupons } from './data/flash-sales.js';
import { newsCategories, news } from './data/news.js';
import { showrooms, showroomImages } from './data/showrooms.js';
import { menus, banners, companyInfo, faqs, projects, projectImages } from './data/site.js';
import {
  contacts, consultationRequests, reviews, carts, cartItems,
  favorites, notifications, searchHistory, chatConversations, chatMessages,
} from './data/demo.js';

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

/**
 * Thứ tự nạp bắt buộc phải tôn trọng khoá ngoại: bảng cha trước, bảng con sau.
 * `tags` phải đứng trước `product_tags`, `projects` trước `project_images`, v.v.
 */
const SEED_ORDER = [
  ['users', users],
  ['user_addresses', userAddresses],

  ['categories', categories],
  ['collections', collections],
  ['brands', brands],

  ['products', products],
  ['product_specs', productSpecs],
  ['product_images', productImages],
  ['tags', tags],
  ['product_tags', productTags],

  ['flash_sales', flashSales],
  ['coupons', coupons],

  ['news_categories', newsCategories],
  ['news', news],

  ['menus', menus],
  ['banners', banners],
  ['company_info', companyInfo],
  ['faqs', faqs],
  ['projects', projects],
  ['project_images', projectImages],

  ['showrooms', showrooms],
  ['showroom_images', showroomImages],

  ['contacts', contacts],
  ['consultation_requests', consultationRequests],
  ['reviews', reviews],

  ['carts', carts],
  ['cart_items', cartItems],
  ['favorites', favorites],
  ['notifications', notifications],
  ['search_history', searchHistory],

  ['chat_conversations', chatConversations],
  ['chat_messages', chatMessages],
];

// Postgres giới hạn 65535 tham số mỗi câu lệnh; chia lô cho an toàn với bảng rộng.
const MAX_PARAMS_PER_STATEMENT = 5000;

async function insertRows(client, table, rows) {
  const columns = Object.keys(rows[0]);
  const rowsPerChunk = Math.max(1, Math.floor(MAX_PARAMS_PER_STATEMENT / columns.length));

  for (let i = 0; i < rows.length; i += rowsPerChunk) {
    const chunk = rows.slice(i, i + rowsPerChunk);
    const params = [];
    const tuples = chunk.map((row) => {
      const placeholders = columns.map((col) => {
        params.push(row[col] ?? null);
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')} ON CONFLICT DO NOTHING`,
      params
    );
  }
}

/**
 * Đưa sequence về sau id lớn nhất vừa nạp, nếu không lần INSERT tiếp theo
 * (tạo sản phẩm từ dashboard chẳng hạn) sẽ đụng id đã tồn tại.
 */
async function syncSequence(client, table, rows) {
  const ids = rows.map((r) => r.id).filter((id) => typeof id === 'number');
  if (ids.length === 0) return;

  await client.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), $2, TRUE)`,
    [table, Math.max(...ids)]
  );
}

/**
 * Nạp toàn bộ dữ liệu mẫu. Idempotent: bảng nào đã có dữ liệu thì bỏ qua,
 * nên chạy lại nhiều lần không sinh bản ghi trùng.
 */
export async function seedAll({ force = false } = {}) {
  const client = await db.connect();
  const seeded = [];
  const skipped = [];

  try {
    await client.query('BEGIN');

    for (const [table, rows] of SEED_ORDER) {
      if (!rows || rows.length === 0) continue;

      if (!force) {
        const { rows: existing } = await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
        if (existing.length > 0) {
          skipped.push(table);
          continue;
        }
      }

      await insertRows(client, table, rows);
      await syncSequence(client, table, rows);
      seeded.push(`${table} (${rows.length})`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { seeded, skipped };
}

// Chạy trực tiếp: `npm run seed`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const force = process.argv.includes('--force');

  seedAll({ force })
    .then(({ seeded, skipped }) => {
      if (seeded.length) {
        console.log('Đã nạp:');
        seeded.forEach((s) => console.log('  +', s));
      }
      if (skipped.length) {
        console.log(`Bỏ qua (đã có dữ liệu): ${skipped.join(', ')}`);
        console.log('Dùng `npm run seed -- --force` để nạp đè lên bảng đã có.');
      }
      console.log('\nTài khoản mẫu:');
      console.log('  admin@namquan.vn    / admin123     (quản trị viên)');
      console.log('  nhanvien@namquan.vn / nhanvien123  (nhân viên)');
      console.log('  customer@namquan.vn / admin123     (khách hàng)');
      return db.end();
    })
    .catch(async (err) => {
      console.error('Seed thất bại:', err.message);
      await db.end();
      process.exit(1);
    });
}
