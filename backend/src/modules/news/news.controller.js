import * as newsService from './news.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, newsService.listNews());
}

export function getById(req, res) {
  ok(res, newsService.getNewsById(req.params.id));
}

export function create(req, res) {
  const article = newsService.createNews(req.body);
  created(res, article, 'Tạo bài viết thành công');
}

export function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const article = newsService.updateNews(id, req.body);
  ok(res, article, 'Cập nhật bài viết thành công');
}

export function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  newsService.deleteNews(id);
  noContent(res);
}
