import db from '../../db/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';

const STATUS_TEXT = {
  pending:   'đang chờ xử lý',
  confirmed: 'đã được xác nhận',
  shipped:   'đang được giao đến bạn',
  delivered: 'đã giao thành công',
  cancelled: 'đã bị hủy',
};

// Lấy items cho nhiều đơn trong 1 query (tránh N+1), trả về map orderId -> items[]
async function itemsByOrder(orderIds) {
  if (orderIds.length === 0) return {};
  const res = await db.query('SELECT * FROM order_items WHERE order_id = ANY($1)', [orderIds]);
  const map = {};
  for (const item of res.rows) {
    (map[item.order_id] ??= []).push({
      productId: item.product_id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      img: item.img,
    });
  }
  return map;
}

export async function listOrders(userId) {
  const res = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  const itemsMap = await itemsByOrder(res.rows.map(r => r.id));
  return res.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    total: row.total,
    status: row.status,
    shippingAddress: row.shipping_address,
    createdAt: row.created_at,
    items: itemsMap[row.id] ?? []
  }));
}

export async function listAllOrders() {
  const res = await db.query(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `);
  const itemsMap = await itemsByOrder(res.rows.map(r => r.id));
  return res.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name ?? 'Khách mua lẻ',
    customerEmail: row.customer_email ?? '',
    total: row.total,
    status: row.status,
    shippingAddress: row.shipping_address,
    createdAt: row.created_at,
    items: itemsMap[row.id] ?? []
  }));
}
export async function updateOrderStatus(orderId, status) {
  const res = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy đơn hàng', 404);
  const order = res.rows[0];

  if (status === 'cancelled' && order.status !== 'cancelled') {
    const itemsRes = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await db.query('UPDATE products SET stock = stock + $1, sold = GREATEST(0, sold - $1) WHERE id = $2', [item.quantity, item.product_id]);
      }
    }
  }

  const updateRes = await db.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, orderId]);
  const updatedOrder = updateRes.rows[0];

  if (updatedOrder.user_id) {
    await createNotification(updatedOrder.user_id, {
      type: 'order_status',
      title: 'Cập nhật đơn hàng 📦',
      message: `Đơn hàng #${updatedOrder.id.substring(0, 8)} của bạn ${STATUS_TEXT[status] ?? status}.`,
      link: `/orders/${updatedOrder.id}`,
    });
  }

  return {
    id: updatedOrder.id,
    status: updatedOrder.status
  };
}

export async function getOrderById(userId, orderId) {
  const res = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy đơn hàng', 404);
  const order = res.rows[0];
  if (order.user_id !== userId) throw new AppError('Bạn không có quyền xem đơn hàng này', 403);
  
  const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  
  return {
    id: order.id,
    userId: order.user_id,
    total: order.total,
    status: order.status,
    shippingAddress: order.shipping_address,
    createdAt: order.created_at,
    items: itemsRes.rows.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      img: item.img
    }))
  };
}

export async function createOrder(userId, { shippingAddress, note, items }) {
  await db.query('BEGIN');
  try {
    let total = 0;
    const enrichedItems = [];

    for (const item of items) {
      const pRes = await db.query('SELECT id, name, price, img, stock FROM products WHERE id = $1', [item.productId]);
      if (pRes.rows.length === 0) throw new AppError(`Không tìm thấy sản phẩm #${item.productId}`, 404);
      const product = pRes.rows[0];
      
      if (product.stock < item.quantity) throw new AppError(`Sản phẩm "${product.name}" không đủ hàng`, 400);
      
      total += product.price * item.quantity;
      enrichedItems.push({
        productId: product.id,
        quantity: item.quantity,
        name: product.name,
        price: product.price,
        img: product.img
      });

      await db.query('UPDATE products SET stock = stock - $1, sold = sold + $1 WHERE id = $2', [item.quantity, product.id]);
    }

    const orderRes = await db.query(
      'INSERT INTO orders (user_id, shipping_address, note, total, final_total, status) VALUES ($1, $2, $3, $4, $4, $5) RETURNING id, created_at',
      [userId, shippingAddress, note ?? '', total, 'pending']
    );
    const orderId = orderRes.rows[0].id;
    const createdAt = orderRes.rows[0].created_at;

    for (const item of enrichedItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, name, price, img) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderId, item.productId, item.quantity, item.name, item.price, item.img]
      );
    }

    // clear cart
    await db.query('DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1 LIMIT 1)', [userId]);

    await db.query('COMMIT');

    await createNotification(userId, {
      type: 'order',
      title: 'Đặt hàng thành công 🛒',
      message: `Đơn hàng #${orderId.substring(0, 8)} trị giá ${total.toLocaleString('vi-VN')}đ đã được tiếp nhận và đang chờ xử lý.`,
      link: `/orders/${orderId}`,
    });

    return {
      id: orderId,
      userId,
      items: enrichedItems,
      total,
      shippingAddress,
      note,
      status: 'pending',
      createdAt
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
