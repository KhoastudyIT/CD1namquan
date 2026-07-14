import * as categoryService from './category.service.js';
import { ok, created, noContent } from '../../utils/response.js';

export async function list(_req, res, next) {
  try {
    ok(res, await categoryService.listCategories());
  } catch (error) {
    next(error);
  }
}


export async function create(req, res) {
  const category = await categoryService.createCategory(req.body);
  created(res, category, 'Tạo danh mục thành công');
}

export async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const category = await categoryService.updateCategory(id, req.body);
  ok(res, category, 'Cập nhật danh mục thành công');
}

export async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  await categoryService.deleteCategory(id);
  noContent(res);
}
