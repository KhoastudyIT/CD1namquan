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

function findIndex(id) {
  const idx = news.findIndex(n => n.id === Number(id));
  if (idx === -1) throw new AppError('Không tìm thấy bài viết', 404);
  return idx;
}

export function createNews(data) {
  const id = news.reduce((max, n) => Math.max(max, n.id), 0) + 1;
  const article = {
    id,
    ...data,
    date: data.date ?? new Date().toLocaleDateString('vi-VN'),
  };
  news.push(article);
  return article;
}

export function updateNews(id, data) {
  const idx = findIndex(id);
  news[idx] = { ...news[idx], ...data };
  return news[idx];
}

export function deleteNews(id) {
  const idx = findIndex(id);
  news.splice(idx, 1);
}
