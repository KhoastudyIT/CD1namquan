import { news } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listNews() {
  return news;
}

export function getNewsById(id) {
  const article = news.find(n => n.id === Number(id));
  if (!article) throw new AppError('Không tìm thấy bài viết', 404);
  return article;
}
