import * as categoryService from './category.service.js';
import { ok } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, categoryService.listCategories());
}
