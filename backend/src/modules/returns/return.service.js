import db from '../../db/index.js';
import { dbCache } from '../../db/store.js';
import { AppError } from '../../middleware/errorHandler.js';
import { storage } from '../../services/storage/index.js';
import {
  canTransitionReturn,
  RETURN_STATUS_LABEL,
  RETURN_TYPE_LABEL,
} from './return.schema.js';

/** Số ngày kể từ lúc đơn được giao mà khách còn được yêu cầu trả / đổi. */
export const RETURN_WINDOW_DAYS = 7;

/** Đơn phải ở trạng thái này mới yêu cầu trả/đổi được. */
const RETURNABLE_ORDER_STATUS = 'delivered';

const RETURN_COLS = `
  r.id,
  r.order_id    AS "orderId",
  r.type,
  r.reason,
  r.images,
  r.status,
  r.admin_note  AS "adminNote",
  r.resolved_at AS "resolvedAt",
  r.created_at  AS "createdAt",
  r.updated_at  AS "updatedAt"
`;

// Thông tin đơn đi kèm để trang quản trị khỏi phải gọi thêm API.
const ORDER_COLS = `
  o.final_total     AS "orderTotal",
  o.status          AS "orderStatus",
  o.payment_status  AS "orderPaymentStatus",
  o.created_at      AS "orderCreatedAt",
  o.customer_name   AS "customerName",
  o.customer_email  AS "customerEmail",
  o.customer_phone  AS "customerPhone"
`;

/**
 * Ảnh lưu dưới dạng object key (returns/uuid.png) chứ không phải URL đầy đủ —
 * đổi tên miền MinIO thì dữ liệu cũ vẫn dùng được. Ghép URL lúc đọc.
 */
function withImageUrls(row) {
  if (!row) return row;
  const keys = Array.isArray(row.images) ? row.images : [];
  return {
    ...row,
    images: keys,
    imageUrls: storage ? keys.map(k => storage.getPublicUrl(k)) : keys,
  };
}

// ─── Khách hàng ──────────────────────────────────────────────────────────────

export async function createReturn(userId, { orderId, type, reason, images }) {
  const ordRes = await db.query(
    'SELECT id, user_id, status, shipping_status, updated_at FROM orders WHERE id = $1',
    [orderId],
  );
  const order = ordRes.rows[0];
  if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
  if (order.user_id !== userId) {
    throw new AppError('Bạn không có quyền thao tác trên đơn hàng này', 403);
  }
  if (order.status !== RETURNABLE_ORDER_STATUS) {
    throw new AppError(
      'Chỉ đơn hàng đã giao mới yêu cầu trả hoặc đổi được. '
      + 'Đơn chưa giao xong thì vui lòng liên hệ để huỷ.',
      400,
    );
  }

  const settled = await db.query(
    `SELECT 1 FROM order_returns
     WHERE order_id = $1 AND status = 'completed' AND type = 'return' LIMIT 1`,
    [orderId],
  );
  if (settled.rows.length > 0 || order.shipping_status === 'returned') {
    throw new AppError('Đơn hàng này đã được trả và hoàn tiền, không gửi thêm yêu cầu được.', 409);
  }

  // Mốc tính hạn là lúc đơn chuyển sang đã giao (updated_at), không phải lúc
  // đặt hàng — đơn giao lâu thì khách vẫn còn đủ thời gian đổi trả.
  const daysSince = (Date.now() - new Date(order.updated_at).getTime()) / 86_400_000;
  if (daysSince > RETURN_WINDOW_DAYS) {
    throw new AppError(
      `Đã quá ${RETURN_WINDOW_DAYS} ngày kể từ khi đơn được giao nên không yêu cầu trả/đổi được nữa.`,
      400,
    );
  }

  try {
    const res = await db.query(
      `INSERT INTO order_returns (order_id, type, reason, images)
       VALUES ($1, $2, $3, $4::jsonb) RETURNING id`,
      [orderId, type, reason, JSON.stringify(images ?? [])],
    );
    return getReturnById(res.rows[0].id);
  } catch (err) {
    // Chỉ mục một-phần chặn yêu cầu thứ hai khi đơn còn yêu cầu đang mở.
    if (err.code === '23505') {
      throw new AppError('Đơn hàng này đang có một yêu cầu chờ xử lý', 409);
    }
    throw err;
  }
}

export async function listMyReturns(userId) {
  const res = await db.query(
    `SELECT ${RETURN_COLS}, ${ORDER_COLS}
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     WHERE o.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId],
  );
  return res.rows.map(withImageUrls);
}

/**
 * Khách tự hủy yêu cầu của mình. Chỉ cho hủy khi còn 'pending': đã duyệt nghĩa
 * là cửa hàng đã xếp lịch nhận hàng, còn rejected/completed là chốt sổ.
 *
 * Xóa hẳn dòng thay vì thêm trạng thái 'cancelled' — CHECK của bảng chỉ nhận 4
 * trạng thái, và xóa mới giải phóng idx_order_returns_one_open để khách gửi lại
 * yêu cầu khác cho cùng đơn.
 */
export async function cancelMyReturn(userId, id) {
  const res = await db.query(
    `SELECT r.id, r.status, o.user_id
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     WHERE r.id = $1`,
    [Number(id)],
  );
  const row = res.rows[0];
  if (!row) throw new AppError('Không tìm thấy yêu cầu trả hàng', 404);
  if (row.user_id !== userId) {
    throw new AppError('Bạn không có quyền thao tác trên yêu cầu này', 403);
  }
  if (row.status !== 'pending') {
    throw new AppError(
      `Yêu cầu đang ở trạng thái "${RETURN_STATUS_LABEL[row.status]}" nên không tự hủy được. `
      + 'Vui lòng liên hệ Nam Quan để được hỗ trợ.',
      400,
    );
  }

  await db.query('DELETE FROM order_returns WHERE id = $1', [row.id]);
  return { id: row.id };
}

// ─── Dùng chung ──────────────────────────────────────────────────────────────

export async function getReturnById(id) {
  const res = await db.query(
    `SELECT ${RETURN_COLS}, ${ORDER_COLS}
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     WHERE r.id = $1`,
    [Number(id)],
  );
  if (!res.rows.length) throw new AppError('Không tìm thấy yêu cầu trả hàng', 404);
  return withImageUrls(res.rows[0]);
}

// ─── Admin / nhân viên ───────────────────────────────────────────────────────

export async function listReturns({ status, type, page = 1, limit = 15 } = {}) {
  const params = [];
  const where = [];

  if (status) { params.push(status); where.push(`r.status = $${params.length}`); }
  if (type) { params.push(type); where.push(`r.type   = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM order_returns r ${whereSql}`,
    params,
  );
  const total = countRes.rows[0].total;

  const listParams = [...params, limit, (page - 1) * limit];
  const res = await db.query(
    `SELECT ${RETURN_COLS}, ${ORDER_COLS}
     FROM order_returns r
     JOIN orders o ON o.id = r.order_id
     ${whereSql}
     ORDER BY r.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows.map(withImageUrls),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Đếm theo trạng thái — dashboard hiện số ngay trên chip lọc. */
export async function countReturnsByStatus() {
  const res = await db.query('SELECT status, COUNT(*)::int AS count FROM order_returns GROUP BY status');
  const counts = { pending: 0, approved: 0, rejected: 0, completed: 0 };
  for (const row of res.rows) counts[row.status] = row.count;
  counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
  return counts;
}

/**
 * Admin / nhân viên xét duyệt yêu cầu.
 *
 * Chỉ khi CHỐT trả hàng (`completed` + type `return`) mới đụng tới kho và tiền:
 * hoàn tồn kho, hoàn suất flash sale, đánh dấu đơn đã trả và đã hoàn tiền.
 *
 * Đổi hàng không đụng kho — khách trả một cái rồi nhận lại một cái cùng loại nên
 * số lượng ròng không đổi.
 *
 * Toàn bộ chạy trong một giao dịch trên cùng một client: nếu hoàn kho xong mà
 * cập nhật đơn lỗi thì mọi thứ phải quay đầu, không được để kho tăng khống.
 */
export async function updateReturnStatus(id, { status, adminNote }) {
  const client = await db.connect();
  let stockChanged = false;
  try {
    await client.query('BEGIN');

    // FOR UPDATE khoá dòng lại: hai nhân viên cùng bấm "Hoàn tất" thì người thứ
    // hai phải chờ, đọc được trạng thái đã đổi và bị máy trạng thái chặn — nếu
    // không sẽ hoàn kho hai lần.
    const cur = await client.query('SELECT * FROM order_returns WHERE id = $1 FOR UPDATE', [Number(id)]);
    if (!cur.rows.length) throw new AppError('Không tìm thấy yêu cầu trả hàng', 404);
    const row = cur.rows[0];

    if (status && status !== row.status && !canTransitionReturn(row.status, status)) {
      const label = (s) => RETURN_STATUS_LABEL[s] ?? s;
      const message = row.status === 'completed' || row.status === 'rejected'
        ? `Yêu cầu đã ở trạng thái "${label(row.status)}" nên không đổi được nữa.`
        : `Không thể chuyển từ "${label(row.status)}" sang "${label(status)}" — quy trình chỉ đi tới, không lùi.`;
      throw new AppError(message, 409);
    }

    const nextStatus = status ?? row.status;

    // Từ chối thì BẮT BUỘC nêu lý do: khách bị từ chối mà không biết vì sao sẽ
    // gửi lại đúng yêu cầu đó, hoặc gọi lên tổng đài — cả hai đều tốn công hơn.
    // Duyệt và hoàn tất thì ghi chú là tuỳ chọn vì bản thân kết quả đã rõ.
    if (nextStatus === 'rejected') {
      const note = (adminNote ?? '').trim() || (row.admin_note ?? '').trim();
      if (!note) {
        throw new AppError('Vui lòng nhập lý do từ chối để khách hàng nắm được', 422);
      }
    }

    const isFinal = nextStatus === 'completed' || nextStatus === 'rejected';

    await client.query(
      `UPDATE order_returns SET
         status      = $2,
         admin_note  = COALESCE($3, admin_note),
         resolved_at = CASE WHEN $4::bool THEN NOW() ELSE resolved_at END
       WHERE id = $1`,
      [Number(id), nextStatus, adminNote ?? null, isFinal],
    );

    // Chốt trả hàng: trả hàng về kho và hoàn tiền cho khách.
    if (nextStatus === 'completed' && row.status !== 'completed' && row.type === 'return') {
      const items = await client.query(
        'SELECT product_id, quantity, flash_sale_id FROM order_items WHERE order_id = $1',
        [row.order_id],
      );
      for (const it of items.rows) {
        if (it.product_id) {
          await client.query(
            'UPDATE products SET stock = stock + $2, sold = GREATEST(0, sold - $2) WHERE id = $1',
            [it.product_id, it.quantity],
          );
        }
        // Hàng trả về thì suất flash sale cũng phải trả lại cho chương trình.
        if (it.flash_sale_id) {
          await client.query(
            'UPDATE flash_sales SET sold = GREATEST(0, sold - $2) WHERE id = $1',
            [it.flash_sale_id, it.quantity],
          );
        }
      }

      // orders.status không có giá trị 'returned' trong ràng buộc CHECK, nên ghi
      // nhận việc trả hàng ở shipping_status — cột này có sẵn 'returned'.
      await client.query(
        `UPDATE orders SET
           shipping_status = 'returned',
           payment_status  = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END
         WHERE id = $1`,
        [row.order_id],
      );
      stockChanged = true;
    }

    await client.query('COMMIT');

    // Tồn kho và số đã bán vừa đổi — xoá cache sản phẩm, nếu không trang cửa
    // hàng còn hiện số cũ cho tới khi TTL hết (giống order.service khi đặt/huỷ đơn).
    if (stockChanged) dbCache.deletePattern('products:');

    return getReturnById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export { RETURN_TYPE_LABEL };
