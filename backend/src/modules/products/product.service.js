import { products, flashSales } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listProducts({ category, type, search, sort = 'newest', page = 1, limit = 12 }) {
  let items = [...products.values()];

  if (category) items = items.filter(p => p.category === category);
  if (type)     items = items.filter(p => p.type === type);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }

  const sortFns = {
    price_asc:  (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating:     (a, b) => b.rating - a.rating,
    sold:       (a, b) => b.sold - a.sold,
    newest:     (a, b) => a.id - b.id,
  };
  items.sort(sortFns[sort] ?? sortFns.newest);

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const data = items.slice((page - 1) * limit, page * limit);

  return { data, meta: { total, page, limit, totalPages } };
}

export function getProductById(id) {
  const product = products.get(Number(id));
  if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
  return product;
}

export function listFlashSales() {
  return [...flashSales.values()];
}

export function createProduct(data) {
  const maxId = products.size > 0 ? Math.max(...products.keys()) : 0;
  const id = maxId + 1;
  const product = { id, ...data, rating: 5.0, sold: 0 };
  products.set(id, product);
  return product;
}

export function updateProduct(id, data) {
  const product = products.get(Number(id));
  if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
  const updated = { ...product, ...data };
  products.set(Number(id), updated);
  return updated;
}

export function deleteProduct(id) {
  if (!products.has(Number(id))) throw new AppError('Không tìm thấy sản phẩm', 404);
  products.delete(Number(id));
}
