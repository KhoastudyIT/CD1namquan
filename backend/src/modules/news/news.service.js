import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function listNews() {
  const res = await db.query('SELECT * FROM news ORDER BY publish_date DESC, id DESC');
  return res.rows;
}

export async function getNewsById(id) {
  const res = await db.query('SELECT * FROM news WHERE id = $1', [id]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy bài viết', 404);
  return res.rows[0];
}
