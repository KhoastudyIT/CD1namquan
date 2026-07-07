import { categories } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listCategories() {
  return categories;
}

function findIndex(id) {
  const idx = categories.findIndex(c => c.id === Number(id));
  if (idx === -1) throw new AppError('Không tìm thấy danh mục', 404);
  return idx;
}

export function createCategory(data) {
  const id = categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
  const category = { id, ...data };
  categories.push(category);
  return category;
}

export function updateCategory(id, data) {
  const idx = findIndex(id);
  categories[idx] = { ...categories[idx], ...data };
  return categories[idx];
}

export function deleteCategory(id) {
  const idx = findIndex(id);
  categories.splice(idx, 1);
}
