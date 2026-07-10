import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';

export async function listCollections() {
  const cacheKey = 'collections:list';
  const cached = dbCache.get(cacheKey);
  if (cached) return cached;

  const res = await db.query('SELECT * FROM collections ORDER BY id ASC');
  const result = res.rows;
  dbCache.set(cacheKey, result, 600000); // 10 minutes cache
  return result;
}
