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
  created(res, article, 'Đã tạo bài viết');
}

export function update(req, res) {
  const article = newsService.updateNews(req.params.id, req.body);
  ok(res, article, 'Đã cập nhật bài viết');
}

export function remove(req, res) {
  newsService.deleteNews(req.params.id);
  noContent(res);
}
