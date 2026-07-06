import * as categoryService from './category.service.js';
import { ok } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await categoryService.listCategories());
  } catch (error) {
    next(error);
  }
}
