import * as newsService from './news.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await newsService.listNews());
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    ok(res, await newsService.getNewsById(req.params.id));
  } catch (error) {
    next(error);
  }
}


export async function create(req, res, next) {
  try {
    const article = await newsService.createNews(req.body);
    created(res, article, 'Tạo bài viết thành công');
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const article = await newsService.updateNews(id, req.body);
    ok(res, article, 'Cập nhật bài viết thành công');
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await newsService.deleteNews(id);
    noContent(res);
  } catch (error) {
    next(error);
  }
}
