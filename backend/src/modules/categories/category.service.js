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
  .replace(/^-+|-+$/g, '') || 'danh-muc';

async function generateUniqueSlug(name, excludeId) {
  const base = toSlug(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const result = await db.query(
      `SELECT 1 FROM categories WHERE slug = $1${excludeId ? ' AND id <> $2' : ''}` ,
      excludeId ? [slug, excludeId] : [slug]
    );
    if (result.rows.length === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export async function listCategories() {
  const cacheKey = 'categories:list';
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const res = await db.query('SELECT * FROM categories ORDER BY id ASC');
  const result = res.rows;
  dbCache.set(cacheKey, result, 600000);
  return result;
}

export async function createCategory(data) {
  const { name, img } = data;
  const slug = await generateUniqueSlug(name);
  const res = await db.query(
    'INSERT INTO categories (name, slug, img) VALUES ($1, $2, $3) RETURNING *',
    [name, slug, img]
  );
  dbCache.delete('categories:list');
  return res.rows[0];
}

export async function updateCategory(id, data) {
  const existing = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) throw new AppError('Category not found', 404);

  const name = data.name ?? existing.rows[0].name;
  const img = data.img ?? existing.rows[0].img;
  const slug = data.name ? await generateUniqueSlug(name, id) : existing.rows[0].slug;
  const res = await db.query(
    'UPDATE categories SET name = $1, slug = $2, img = $3 WHERE id = $4 RETURNING *',
    [name, slug, img, id]
  );
  dbCache.delete('categories:list');
  dbCache.deletePattern('products:');
  return res.rows[0];
}

export async function deleteCategory(id) {
  const usage = await db.query('SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1', [id]);
  if (usage.rows[0].count > 0) {
    throw new AppError('Cannot delete a category that is assigned to products', 409);
  }
  const res = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  if (res.rows.length === 0) throw new AppError('Category not found', 404);
  dbCache.delete('categories:list');
}
