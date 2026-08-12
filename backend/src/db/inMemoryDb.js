import { newDb, DataType } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function interpolateQuery(text, params) {
  if (!params || !params.length) return text;
  return text.replace(/\$(\d+)/g, (_, num) => {
    const idx = parseInt(num, 10) - 1;
    if (idx < 0 || idx >= params.length) return `$${num}`;
    const val = params[idx];
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (val === null || val === undefined) return 'NULL';
    if (Array.isArray(val)) {
      if (val.length === 0) return "'{}'";
      return `ARRAY[${val.map((v) => (typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`)).join(',')}]`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
  });
}

function seedInMemory(db) {
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

  for (const [table, rows] of SEED_ORDER) {
    if (!rows || rows.length === 0) continue;
    const columns = Object.keys(rows[0]);
    for (const row of rows) {
      const vals = columns.map((col) => {
        const v = row[col];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return v;
        if (Array.isArray(v)) {
          if (v.length === 0) return "'{}'";
          return `'{"${v.map((s) => String(s).replace(/"/g, '\\"')).join('","')}"}'`;
        }
        if (v instanceof Date) return `'${v.toISOString()}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${vals.join(', ')})`;
      try {
        db.public.none(sql);
      } catch (err) {
        // Ignore duplicate insert errors
      }
    }
  }
}

export function createInMemoryDb() {
  const db = newDb();

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => {
      const crypto = globalThis.crypto;
      return crypto.randomUUID();
    },
  });

  db.public.registerFunction({
    name: 'unaccent',
    args: [DataType.text],
    returns: DataType.text,
    implementation: (str) => str ?? '',
  });

  const toCharImpl = (date, _fmt) => {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().slice(0, 10);
  };

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.timestamp, DataType.text],
    returns: DataType.text,
    implementation: toCharImpl,
  });

  db.public.registerFunction({
    name: 'to_char',
    args: [DataType.timestamptz, DataType.text],
    returns: DataType.text,
    implementation: toCharImpl,
  });

  const sqlPath = path.join(__dirname, '..', '..', 'database', 'nam_quan_database.sql');
  let sql = fs.readFileSync(sqlPath, 'utf8');

  sql = sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/CREATE EXTENSION[^\n]+/gi, '')
    .replace(/CREATE OR REPLACE FUNCTION[\s\S]*?LANGUAGE\s+\w+;/gi, '')
    .replace(/CREATE TRIGGER[^\n]+/gi, '')
    .replace(/CREATE OR REPLACE VIEW[\s\S]*?;/gi, '')
    .replace(/,\s*CONSTRAINT\s+flash_sales_no_overlap[\s\S]*?\)\s*WHERE\s*\(active\)/gi, '')
    .replace(/SELECT setval[^\n]+/gi, '');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      db.public.none(stmt);
    } catch (err) {
      // Ignore unsupported pg-mem DDL statements
    }
  }

  // Populate seed data into pg-mem
  seedInMemory(db);

  const pgAdapter = db.adapters.createPg();
  const pool = new pgAdapter.Pool();

  const originalQuery = pool.query.bind(pool);
  pool.query = async (text, params) => {
    let qText = text;
    if (typeof qText === 'string') {
      if (qText.includes('SELECT u.*')) {
        qText = qText.replace('SELECT u.*', 'SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at');
      }

      // Remove FOR UPDATE for pg-mem compatibility
      qText = qText.replace(/FOR\s+UPDATE(\s+OF\s+\w+)?/gi, '');

      // Transform LEFT JOIN LATERAL for pg-mem compatibility
      if (/LEFT\s+JOIN\s+LATERAL/i.test(qText)) {
        qText = qText.replace(
          /LEFT\s+JOIN\s+LATERAL\s*\([\s\S]*?\)\s*active_flash\s*ON\s*TRUE/gi,
          'LEFT JOIN (SELECT id, product_id, price, (stock - sold) AS remaining FROM flash_sales WHERE active = TRUE) active_flash ON active_flash.product_id = p.id'
        );
      }

      // Fix serial PK auto increment in pg-mem when explicit seed IDs exist
      const serialTables = ['products', 'categories', 'collections', 'news', 'flash_sales', 'reviews', 'chat_conversations', 'chat_messages', 'consultation_requests'];
      for (const table of serialTables) {
        const regex = new RegExp(`INSERT INTO ${table}\\s*\\((?![^\\)]*\\bid\\b)`, 'i');
        if (regex.test(qText)) {
          qText = qText
            .replace(new RegExp(`INSERT INTO ${table}\\s*\\(`, 'i'), `INSERT INTO ${table} (id, `)
            .replace(/VALUES\s*\(/i, `VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM ${table}), `);
          break;
        }
      }

      if (params && params.length > 0) {
        qText = interpolateQuery(qText, params);
      }
    }
    try {
      return await originalQuery(qText);
    } catch {
      return await originalQuery(qText);
    }
  };

  return pool;
}
