import * as newsService from './news.service.js';
import { ok } from '../../utils/response.js';

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
