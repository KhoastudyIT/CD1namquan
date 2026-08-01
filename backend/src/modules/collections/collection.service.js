import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

const toSlug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\u0111/g, 'd')
  .replace(/\u0110/g, 'D')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'bo-suu-tap';

async function generateUniqueSlug(name, excludeId) {
  const base = toSlug(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const result = await db.query(
      `SELECT 1 FROM collections WHERE slug = $1${excludeId ? ' AND id <> $2' : ''}`,
      excludeId ? [slug, excludeId] : [slug]
    );
    if (result.rows.length === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export async function listCollections() {
  const cacheKey = 'collections:list';
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const res = await db.query('SELECT * FROM collections ORDER BY id ASC');
  const result = res.rows;
  dbCache.set(cacheKey, result, 600000); // 10 minutes cache
  return result;
}

export async function createCollection(data) {
  const { name, img } = data;
  const slug = await generateUniqueSlug(name);
  const res = await db.query(
    'INSERT INTO collections (name, slug, img) VALUES ($1, $2, $3) RETURNING *',
    [name, slug, img]
  );
  dbCache.delete('collections:list');
  return res.rows[0];
}

export async function updateCollection(id, data) {
  const existing = await db.query('SELECT * FROM collections WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Không tìm thấy bộ sưu tập', 404);

  const name = data.name ?? existing.rows[0].name;
  const img  = data.img  ?? existing.rows[0].img;
  const slug = data.name ? await generateUniqueSlug(name, id) : existing.rows[0].slug;

  const res = await db.query(
    'UPDATE collections SET name = $1, slug = $2, img = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [name, slug, img, id]
  );
  dbCache.delete('collections:list');
  return res.rows[0];
}

export async function deleteCollection(id) {
  const res = await db.query('DELETE FROM collections WHERE id = $1 RETURNING *', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bộ sưu tập', 404);
  dbCache.delete('collections:list');
}
