import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

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
  const res = await db.query(
    'INSERT INTO collections (name, img) VALUES ($1, $2) RETURNING *',
    [name, img]
  );
  dbCache.delete('collections:list');
  return res.rows[0];
}

export async function updateCollection(id, data) {
  const { name, img } = data;
  let res;
  if (name && img) {
    res = await db.query('UPDATE collections SET name = $1, img = $2 WHERE id = $3 RETURNING *', [name, img, id]);
  } else if (name) {
    res = await db.query('UPDATE collections SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
  } else if (img) {
    res = await db.query('UPDATE collections SET img = $1 WHERE id = $2 RETURNING *', [img, id]);
  }
  if (!res || res.rows.length === 0) throw new AppError('Không tìm thấy bộ sưu tập', 404);
  dbCache.delete('collections:list');
  return res.rows[0];
}

export async function deleteCollection(id) {
  const res = await db.query('DELETE FROM collections WHERE id = $1 RETURNING *', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bộ sưu tập', 404);
  dbCache.delete('collections:list');
}
