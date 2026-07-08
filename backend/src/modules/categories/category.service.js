import { categories } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listCategories() {
  return categories;
}

export function createCategory(data) {
  const maxId = categories.reduce((max, c) => (c.id > max ? c.id : max), 0);
  const newCategory = {
    id: maxId + 1,
    name: data.name,
    img: data.img || '/images/placeholder.jpg',
  };
  categories.push(newCategory);
  return newCategory;
}

export function updateCategory(id, data) {
  const category = categories.find(c => c.id === id);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục', 404);
  }
  if (data.name !== undefined) category.name = data.name;
  if (data.img !== undefined) category.img = data.img;
  return category;
}

export function deleteCategory(id) {
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) {
    throw new AppError('Không tìm thấy danh mục', 404);
  }
  const deleted = categories.splice(index, 1);
  return deleted[0];
}
