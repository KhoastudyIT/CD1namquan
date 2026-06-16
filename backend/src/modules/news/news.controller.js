import * as newsService from './news.service.js';
import { ok } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, newsService.listNews());
}

export function getById(req, res) {
  ok(res, newsService.getNewsById(req.params.id));
}
