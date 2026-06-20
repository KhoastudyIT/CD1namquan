import { randomUUID } from 'crypto';
import { orders, products, carts, users } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';

const STATUS_TEXT = {
  pending:   'đang chờ xử lý',
  confirmed: 'đã được xác nhận',
  shipped:   'đang được giao đến bạn',
  delivered: 'đã giao thành công',
  cancelled: 'đã bị hủy',
};

export function listOrders(userId) {
  return [...orders.values()]
    .filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Admin: list every order with basic customer info attached. */
export function listAllOrders() {
  return [...orders.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(o => {
      const customer = users.get(o.userId);
      return {
        ...o,
        customerName:  customer?.name  ?? 'Khách mua lẻ',
        customerEmail: customer?.email ?? '',
      };
    });
}

/** Admin: change an order's status. Restores stock when an order is cancelled. */
export function updateOrderStatus(orderId, status) {
  const order = orders.get(orderId);
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

  if (status === 'cancelled' && order.status !== 'cancelled') {
    order.items.forEach(({ productId, quantity }) => {
      const product = products.get(productId);
      if (product) {
        product.stock += quantity;
        product.sold  = Math.max(0, product.sold - quantity);
      }
    });
  }

  order.status = status;
  orders.set(orderId, order);

  createNotification(order.userId, {
    type: 'order_status',
    title: 'Cập nhật đơn hàng 📦',
    message: `Đơn hàng #${order.id.substring(0, 8)} của bạn ${STATUS_TEXT[status] ?? status}.`,
    link: `/orders/${order.id}`,
  });

  return order;
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

  createNotification(userId, {
    type: 'order',
    title: 'Đặt hàng thành công 🛒',
    message: `Đơn hàng #${order.id.substring(0, 8)} trị giá ${total.toLocaleString('vi-VN')}đ đã được tiếp nhận và đang chờ xử lý.`,
    link: `/orders/${order.id}`,
  });

  return order;
}
