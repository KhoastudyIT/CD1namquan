import db from '../../db/index.js';

export async function listCategories() {
  const res = await db.query('SELECT * FROM categories ORDER BY id ASC');
  return res.rows;
}
