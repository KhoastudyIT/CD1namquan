import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function listCategories() {
  const cacheKey = 'categories:list';
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const res = await db.query('SELECT * FROM categories ORDER BY id ASC');
  const result = res.rows;
  dbCache.set(cacheKey, result, 600000); // 10 minutes cache
  return result;
}

export async function createCategory(data) {
  const { name, img } = data;
  const res = await db.query(
    'INSERT INTO categories (name, img) VALUES ($1, $2) RETURNING *',
    [name, img]
  );
  dbCache.delete('categories:list');
  return res.rows[0];
}

export async function updateCategory(id, data) {
  const { name, img } = data;
  let res;
  if (name && img) {
    res = await db.query('UPDATE categories SET name = $1, img = $2 WHERE id = $3 RETURNING *', [name, img, id]);
  } else if (name) {
    res = await db.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
  } else if (img) {
    res = await db.query('UPDATE categories SET img = $1 WHERE id = $2 RETURNING *', [img, id]);
  }
  if (!res || res.rows.length === 0) throw new AppError('Không tìm thấy danh mục', 404);
  dbCache.delete('categories:list');
  return res.rows[0];
}

export async function deleteCategory(id) {
  const res = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy danh mục', 404);
  dbCache.delete('categories:list');
}
