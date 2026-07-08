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

export function createNews(data) {
  const maxId = news.reduce((max, n) => (n.id > max ? n.id : max), 0);
  const newArticle = {
    id: maxId + 1,
    title: data.title,
    img: data.img || '/images/placeholder.jpg',
    excerpt: data.excerpt,
    content: data.content,
    date: data.date || new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
  news.push(newArticle);
  return newArticle;
}

export function updateNews(id, data) {
  const article = news.find(n => n.id === id);
  if (!article) throw new AppError('Không tìm thấy bài viết', 404);

  if (data.title !== undefined) article.title = data.title;
  if (data.img !== undefined) article.img = data.img;
  if (data.excerpt !== undefined) article.excerpt = data.excerpt;
  if (data.content !== undefined) article.content = data.content;
  if (data.date !== undefined) article.date = data.date;

  return article;
}

export function deleteNews(id) {
  const index = news.findIndex(n => n.id === id);
  if (index === -1) throw new AppError('Không tìm thấy bài viết', 404);
  const deleted = news.splice(index, 1);
  return deleted[0];
}
