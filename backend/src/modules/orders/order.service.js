import { randomUUID } from 'crypto';
import { orders, products, carts } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';

export function listOrders(userId) {
  return [...orders.values()]
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getOrderById(userId, orderId) {
  const order = orders.get(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
  if (order.userId !== userId) throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
  return order;
}

export function createOrder(userId, { shippingAddress, note, items }) {
  const enrichedItems = items.map(({ productId, quantity }) => {
    const product = products.get(productId);
    if (!product) throw new AppError(`Không tìm thấy sản phẩm #${productId}`, 404);
    if (product.stock < quantity) throw new AppError(`Sản phẩm "${product.name}" không đủ hàng`, 400);
    return { productId, quantity, name: product.name, price: product.price, img: product.img };
  });

  const total = enrichedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  enrichedItems.forEach(({ productId, quantity }) => {
    const product = products.get(productId);
    product.stock -= quantity;
    product.sold  += quantity;
  });

  carts.delete(userId);

  const order = {
    id:              randomUUID(),
    userId,
    items:           enrichedItems,
    total,
    shippingAddress,
    note:            note ?? '',
    status:          'pending',
    createdAt:       new Date().toISOString(),
  };
  orders.set(order.id, order);
  return order;
}
