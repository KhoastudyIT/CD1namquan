import { carts, products } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

function getUserCart(userId) {
  if (!carts.has(userId)) carts.set(userId, { items: [] });
  return carts.get(userId);
}

function buildCartResponse(userId) {
  const cart = getUserCart(userId);
  const enriched = cart.items
    .map(item => ({ ...item, product: products.get(item.productId) }))
    .filter(item => item.product);
  const total = enriched.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const itemCount = enriched.reduce((sum, i) => sum + i.quantity, 0);
  return { items: enriched, total, itemCount };
}

export function getCart(userId) {
  return buildCartResponse(userId);
}

export function addItem(userId, { productId, quantity }) {
  if (!products.has(productId)) throw new AppError('Không tìm thấy sản phẩm', 404);
  const cart = getUserCart(userId);
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  return buildCartResponse(userId);
}

export function updateItem(userId, productId, quantity) {
  const cart = getUserCart(userId);
  const item = cart.items.find(i => i.productId === Number(productId));
  if (!item) throw new AppError('Sản phẩm không có trong giỏ hàng', 404);
  item.quantity = quantity;
  return buildCartResponse(userId);
}

export function removeItem(userId, productId) {
  const cart = getUserCart(userId);
  cart.items = cart.items.filter(i => i.productId !== Number(productId));
  return buildCartResponse(userId);
}

export function clearCart(userId) {
  carts.set(userId, { items: [] });
}
