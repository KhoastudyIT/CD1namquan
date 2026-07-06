import db from '../../db/index.js';

export async function listCollections() {
  const res = await db.query('SELECT * FROM collections ORDER BY id ASC');
  return res.rows;
}
