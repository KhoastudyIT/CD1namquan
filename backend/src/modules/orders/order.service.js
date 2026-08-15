import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';
import { activeFlashJoin, effectivePriceSQL } from '../../utils/price.js';

const STATUS_TEXT = {
  pending: 'đang chờ xử lý',
  confirmed: 'đã được xác nhận',
  shipped: 'đang được giao đến bạn',
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
      listPrice: item.list_price,
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
    shippingStatus: row.shipping_status,
    paymentStatus: row.payment_status,
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
    // Trả hàng ghi nhận ở shipping_status ('returned') vì orders.status không có
    // giá trị đó — client cần cả hai mới hiển thị đúng tình trạng đơn.
    shippingStatus: row.shipping_status,
    paymentStatus: row.payment_status,
    shippingAddress: row.shipping_address,
    createdAt: row.created_at,
    items: itemsMap[row.id] ?? []
  }));
}
const STATUS_RANKS = {
  pending: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 99
};

export async function updateOrderStatus(orderId, status) {
  const res = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (res.rows.length === 0) throw new AppError('Không tìm thấy đơn hàng', 404);
  const order = res.rows[0];

  const currentRank = STATUS_RANKS[order.status] || 1;
  const nextRank = STATUS_RANKS[status] || 1;

  if (order.status === 'delivered') {
    throw new AppError('Đơn hàng đã giao thành công, không thể thay đổi trạng thái nữa.', 400);
  }
  if (order.status === 'cancelled') {
    throw new AppError('Đơn hàng đã bị hủy, không thể thay đổi trạng thái nữa.', 400);
  }
  if (status !== 'cancelled' && nextRank <= currentRank) {
    throw new AppError('Quy trình xử lý đơn hàng chỉ được tiến tới, không được lùi trạng thái cũ.', 400);
  }

  if (status === 'cancelled' && order.status !== 'cancelled') {
    const itemsRes = await db.query('SELECT product_id, quantity, flash_sale_id FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await db.query('UPDATE products SET stock = stock + $1, sold = GREATEST(0, sold - $1) WHERE id = $2', [item.quantity, item.product_id]);
      }
      // Trả lại suất flash sale, nếu không đơn huỷ vẫn ăn mất suất của chương trình.
      if (item.flash_sale_id) {
        await db.query('UPDATE flash_sales SET sold = GREATEST(0, sold - $1) WHERE id = $2', [item.quantity, item.flash_sale_id]);
      }
    }
    // Huỷ đơn hoàn kho và hoàn suất flash sale -> số liệu đang cache đã cũ.
    dbCache.deletePattern('products:');
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
    shippingStatus: order.shipping_status,
    paymentStatus: order.payment_status,
    shippingAddress: order.shipping_address,
    createdAt: order.created_at,
    items: itemsRes.rows.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      listPrice: item.list_price,
      img: item.img
    }))
  };
}

/**
 * Bản đầy đủ của một đơn hàng, dùng để in hoá đơn.
 *
 * Khác getOrderById ở hai điểm: trả về đủ mọi trường cần cho hoá đơn (thông tin
 * người nhận, phương thức thanh toán, phí vận chuyển, giảm giá, tổng cuối), và
 * KHÔNG tự kiểm tra chủ sở hữu — việc đó do controller quyết định, vì admin và
 * nhân viên được in hoá đơn của mọi đơn còn khách chỉ được in đơn của mình.
 */
export async function getOrderForInvoice(orderId) {
  // Lấy kèm thông tin tài khoản: nhiều đơn cũ có customer_name/phone/email rỗng
  // vì lúc đặt chỉ lưu user_id — khi đó hoá đơn lấy tạm thông tin tài khoản
  // thay vì in ra dấu gạch ngang.
  const res = await db.query(
    `SELECT o.*,
            u.name  AS account_name,
            u.email AS account_email,
            u.phone AS account_phone
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = $1`,
    [orderId],
  );
  if (res.rows.length === 0) throw new AppError('Không tìm thấy đơn hàng', 404);
  const o = res.rows[0];

  const itemsRes = await db.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
    [orderId],
  );

  return {
    id: o.id,
    userId: o.user_id,
    customerName:  o.customer_name  || o.account_name  || '',
    customerEmail: o.customer_email || o.account_email || '',
    customerPhone: o.customer_phone || o.account_phone || '',
    total: o.total,
    shippingFee: o.shipping_fee,
    discountAmount: o.discount_amount,
    finalTotal: o.final_total,
    shippingAddress: o.shipping_address,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    shippingStatus: o.shipping_status,
    status: o.status,
    note: o.note,
    createdAt: o.created_at,
    items: itemsRes.rows.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      listPrice: item.list_price,
      // Có flash sale thì hoá đơn ghi rõ "Flash Sale −X%" thay vì "Khuyến mãi".
      flashSaleId: item.flash_sale_id,
    })),
  };
}

export async function createOrder(userId, { shippingAddress, note, items, phone = '' }) {
  await db.query('BEGIN');
  try {
    let total = 0;
    const enrichedItems = [];

    for (const item of items) {
      // Chốt giá hiệu lực tại thời điểm đặt hàng — phải khớp với giá khách vừa
      // nhìn thấy ở giỏ hàng, không phải giá niêm yết.
      // FOR UPDATE khoá dòng sản phẩm tới hết transaction: hai khách bấm đặt cùng
      // lúc sẽ xếp hàng, không cùng đọc được số suất flash còn lại rồi cùng mua.
      const pRes = await db.query(`
        SELECT p.id, p.name, p.img, p.stock,
               p.price AS list_price,
               ${effectivePriceSQL('p')} AS price,
               active_flash.id AS flash_id,
               active_flash.remaining AS flash_remaining
        FROM products p${activeFlashJoin('p')}
        WHERE p.id = $1
        FOR UPDATE OF p
      `, [item.productId]);
      if (pRes.rows.length === 0) throw new AppError(`Không tìm thấy sản phẩm #${item.productId}`, 404);
      const product = pRes.rows[0];

      if (product.stock < item.quantity) throw new AppError(`Sản phẩm "${product.name}" không đủ hàng`, 400);

      // Mỗi dòng đơn hàng chỉ mang được một đơn giá, nên không thể vừa bán giá
      // flash cho phần trong suất vừa bán giá thường cho phần vượt. Chặn sớm và
      // nói rõ còn bao nhiêu suất, thay vì âm thầm tính giá khác giá đã hiển thị.
      if (product.flash_id && item.quantity > product.flash_remaining) {
        throw new AppError(
          `Sản phẩm "${product.name}" chỉ còn ${product.flash_remaining} suất giá flash sale, bạn đang đặt ${item.quantity}.`,
          400
        );
      }

      const unitPrice = Number(product.price);
      total += unitPrice * item.quantity;
      enrichedItems.push({
        productId: product.id,
        quantity: item.quantity,
        name: product.name,
        price: unitPrice,
        listPrice: Number(product.list_price),
        img: product.img,
        flashId: product.flash_id ?? null
      });

      await db.query('UPDATE products SET stock = stock - $1, sold = sold + $1 WHERE id = $2', [item.quantity, product.id]);

      // Trừ suất flash sale đã dùng, nếu không chương trình sẽ chạy vô thời hạn.
      if (product.flash_id) {
        await db.query('UPDATE flash_sales SET sold = sold + $1 WHERE id = $2', [item.quantity, product.flash_id]);
      }
    }

    let orderRes;
    try {
      orderRes = await db.query(
        'INSERT INTO orders (user_id, shipping_address, customer_phone, note, total, final_total, status) VALUES ($1, $2, $3, $4, $5, $5, $6) RETURNING id, created_at',
        [userId, shippingAddress, phone ?? '', note ?? '', total, 'pending']
      );
    } catch {
      orderRes = await db.query(
        'INSERT INTO orders (user_id, shipping_address, note, total, final_total, status) VALUES ($1, $2, $3, $4, $4, $5) RETURNING id, created_at',
        [userId, shippingAddress, note ?? '', total, 'pending']
      );
    }

    if (phone) {
      await db.query('UPDATE users SET phone = $1 WHERE id = $2 AND (phone IS NULL OR phone = \'\')', [phone, userId]).catch(() => {});
    }

    const orderId = orderRes.rows[0].id;
    const createdAt = orderRes.rows[0].created_at;

    for (const item of enrichedItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, name, price, list_price, img, flash_sale_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [orderId, item.productId, item.quantity, item.name, item.price, item.listPrice, item.img, item.flashId]
      );
    }

    // clear cart
    await db.query('DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1 LIMIT 1)', [userId]);

    await db.query('COMMIT');

    // Đơn hàng vừa đổi stock, sold và số suất flash sale. Không xoá cache thì
    // danh sách sản phẩm và flash sale còn phục vụ số liệu cũ tới 5 phút — kể cả
    // giá hiệu lực, tức là lại quảng cáo giá flash cho chương trình đã hết suất.
    dbCache.deletePattern('products:');

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
