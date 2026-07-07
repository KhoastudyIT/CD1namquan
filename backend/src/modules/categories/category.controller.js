import * as categoryService from './category.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export function list(_req, res) {
  ok(res, categoryService.listCategories());
}

export function create(req, res) {
  const category = categoryService.createCategory(req.body);
  created(res, category, 'Đã tạo danh mục');
}

export function update(req, res) {
  const category = categoryService.updateCategory(req.params.id, req.body);
  ok(res, category, 'Đã cập nhật danh mục');
}

export function remove(req, res) {
  categoryService.deleteCategory(req.params.id);
  noContent(res);
}
