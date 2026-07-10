import * as categoryService from './category.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await categoryService.listCategories());
  } catch (error) {
    next(error);
  }
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

export function create(req, res) {
  const category = categoryService.createCategory(req.body);
  created(res, category, 'Tạo danh mục thành công');
}

export function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const category = categoryService.updateCategory(id, req.body);
  ok(res, category, 'Cập nhật danh mục thành công');
}

export function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  categoryService.deleteCategory(id);
  noContent(res);
}
