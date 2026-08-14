import db from '../../db/index.js';

const LOW_STOCK_THRESHOLD = 10;

/**
 * Gom toàn bộ số liệu cho báo cáo Excel trong một khoảng ngày.
 *
 * Khác getOverview (luôn cố định 7 ngày, phục vụ các thẻ số trên dashboard),
 * hàm này nhận khoảng ngày tuỳ ý và trả thêm danh sách đơn hàng chi tiết cùng
 * danh sách hàng sắp hết — những thứ chỉ có ý nghĩa khi tải về xem offline.
 *
 * `to` được cộng thêm một ngày ở tầng controller nên ở đây so sánh nửa mở
 * [from, to) — tránh sót đơn đặt trong ngày cuối kỳ.
 */
export async function getReportData({ from, to }) {
  const period = [from, to];

  const [
    summaryRes, itemsRes, newCustomersRes, productsAggr, customersAggr,
    revenueByDayRes, topProductsRes, ordersRes, byStatusRes, lowStockRes,
    byCategoryRes, topCustomersRes, returnsRes, consultRes,
  ] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status <> 'cancelled')            AS orders,
        COUNT(*) FILTER (WHERE status =  'cancelled')            AS cancelled,
        COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS revenue
      FROM orders WHERE created_at >= $1 AND created_at < $2
    `, period),
    db.query(`
      SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'cancelled'
    `, period),
    db.query(
      `SELECT COUNT(*) AS c FROM users
       WHERE role = 'customer' AND created_at >= $1 AND created_at < $2`,
      period,
    ),
    db.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE stock < $1) AS low FROM products`,
      [LOW_STOCK_THRESHOLD],
    ),
    db.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer'`),
    db.query(`
      SELECT TO_CHAR(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS date,
             COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE created_at >= $1 AND created_at < $2 AND status <> 'cancelled'
      GROUP BY date ORDER BY date ASC
    `, period),
    db.query(`
      SELECT p.name, COALESCE(c.name, '—') AS category,
             SUM(oi.quantity)::int AS sold,
             SUM(oi.quantity * oi.price)::bigint AS revenue,
             p.stock
      FROM order_items oi
      JOIN orders o   ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'cancelled'
      GROUP BY p.id, p.name, p.stock, c.name
      ORDER BY sold DESC
      LIMIT 20
    `, period),
    db.query(`
      SELECT o.id, o.created_at, o.customer_name, o.customer_phone,
             o.total, o.status, o.payment_status,
             COALESCE(COUNT(oi.id), 0)::int AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.created_at >= $1 AND o.created_at < $2
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, period),
    db.query(`
      SELECT status, COUNT(*)::int AS count FROM orders
      WHERE created_at >= $1 AND created_at < $2
      GROUP BY status ORDER BY count DESC
    `, period),
    db.query(`
      SELECT p.name, p.sku, COALESCE(c.name, '—') AS category, p.stock, p.sold
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.stock < $1
      ORDER BY p.stock ASC
    `, [LOW_STOCK_THRESHOLD]),
    // ── Bốn nguồn số liệu bổ sung cho báo cáo đầy đủ ────────────────────────
    db.query(`
      SELECT COALESCE(c.name, 'Chưa phân loại') AS category,
             SUM(oi.quantity)::int               AS sold,
             SUM(oi.quantity * oi.price)::bigint AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
        LEFT JOIN products p   ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.created_at >= $1 AND o.created_at < $2
       GROUP BY c.name ORDER BY revenue DESC
    `, period),
    db.query(`
      SELECT COALESCE(NULLIF(o.customer_name, ''), u.name, 'Khách mua lẻ') AS name,
             COALESCE(NULLIF(o.customer_phone, ''), u.phone, '')           AS phone,
             COALESCE(NULLIF(o.customer_email, ''), u.email, '')           AS email,
             COUNT(*)::int                     AS orders,
             COALESCE(SUM(o.total), 0)::bigint AS spent
        FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'cancelled'
       GROUP BY 1, 2, 3 ORDER BY spent DESC LIMIT 30
    `, period),
    db.query(`
      SELECT r.id, r.created_at, r.type, r.status, r.reason, r.admin_note, r.resolved_at,
             o.total,
             COALESCE(NULLIF(o.customer_name, ''), u.name, 'Khách mua lẻ') AS customer_name
        FROM order_returns r
        JOIN orders o ON o.id = r.order_id
        LEFT JOIN users u ON u.id = o.user_id
       WHERE r.created_at >= $1 AND r.created_at < $2
       ORDER BY r.created_at DESC
    `, period),
    db.query(`
      SELECT id, created_at, name, phone, email, service_type, property_type,
             area, budget, status
        FROM consultation_requests
       WHERE created_at >= $1 AND created_at < $2
       ORDER BY created_at DESC
    `, period),
  ]);

  const s = summaryRes.rows[0];
  const orders = parseInt(s.orders, 10);
  const revenue = parseInt(s.revenue, 10);

  return {
    summary: {
      revenue,
      orders,
      cancelledOrders: parseInt(s.cancelled, 10),
      avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
      itemsSold: parseInt(itemsRes.rows[0].items_sold, 10),
      newCustomers: parseInt(newCustomersRes.rows[0].c, 10),
      totalProducts: parseInt(productsAggr.rows[0].total, 10),
      lowStockCount: parseInt(productsAggr.rows[0].low, 10),
      totalCustomers: parseInt(customersAggr.rows[0].c, 10),
    },
    revenueByDay: revenueByDayRes.rows.map(r => ({
      date: r.date,
      orders: parseInt(r.orders, 10),
      revenue: parseInt(r.revenue, 10),
    })),
    topProducts: topProductsRes.rows.map(r => ({
      name: r.name,
      category: r.category,
      sold: r.sold,
      revenue: parseInt(r.revenue, 10),
      stock: r.stock,
    })),
    orders: ordersRes.rows.map(r => ({
      id: r.id,
      createdAt: r.created_at,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      total: r.total,
      status: r.status,
      paymentStatus: r.payment_status,
      itemCount: r.item_count,
    })),
    ordersByStatus: byStatusRes.rows,
    lowStock: lowStockRes.rows,
    revenueByCategory: byCategoryRes.rows.map(r => ({
      category: r.category, sold: r.sold, revenue: parseInt(r.revenue, 10),
    })),
    topCustomers: topCustomersRes.rows.map(r => ({
      name: r.name, phone: r.phone, email: r.email,
      orders: r.orders, spent: parseInt(r.spent, 10),
    })),
    returns: returnsRes.rows.map(r => ({
      id: r.id, createdAt: r.created_at, type: r.type, status: r.status,
      reason: r.reason, adminNote: r.admin_note, resolvedAt: r.resolved_at,
      orderTotal: r.total, customerName: r.customer_name,
    })),
    consultations: consultRes.rows.map(r => ({
      id: r.id, createdAt: r.created_at, name: r.name, phone: r.phone,
      email: r.email, serviceType: r.service_type, propertyType: r.property_type,
      area: r.area, budget: r.budget, status: r.status,
    })),
  };
}


/**
 * Định dạng ngày theo GIỜ ĐỊA PHƯƠNG.
 *
 * Không dùng toISOString() được: hàm đó quy về UTC nên ở múi giờ +07, mốc
 * 01/07 lúc 00:00 sẽ bị in thành 30/06 — lệch đúng một ngày.
 */
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Mức tăng trưởng so với kỳ trước, tính theo phần trăm. */
function growth(now, before) {
  if (!before) return now > 0 ? 100 : 0;
  return Math.round(((now - before) / before) * 1000) / 10;
}

/** Điền đủ mọi ngày trong khoảng, ngày không có đơn thì để 0. */
function fillDays(rows, from, to) {
  const map = new Map(rows.map(r => [r.date, r]));
  const out = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  while (d < end) {
    const key = ymd(d);
    const hit = map.get(key);
    out.push({
      date: key,
      orders: hit ? parseInt(hit.orders, 10) : 0,
      revenue: hit ? parseInt(hit.revenue, 10) : 0,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Toàn bộ số liệu cho trang Tổng quan của dashboard.
 *
 * Nhận khoảng ngày tuỳ ý; bỏ trống thì lấy 30 ngày gần nhất. Ngoài các chỉ số
 * trong kỳ, hàm còn truy vấn KỲ TRƯỚC có cùng độ dài để tính mức tăng trưởng —
 * một con số doanh thu đứng một mình không nói lên điều gì nếu không có mốc so.
 *
 * Vẫn giữ các trường phẳng cũ (totalRevenue, totalOrders...) để phần giao diện
 * chưa kịp cập nhật không bị vỡ.
 */
export async function getOverview({ from, to } = {}) {
  // Mặc định 30 ngày gần nhất, tính tới hết hôm nay.
  const end = to ?? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); return d; })();
  const start = from ?? new Date(end.getTime() - 30 * 86_400_000);

  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime());
  const prevStart = new Date(start.getTime() - spanMs);

  const P = [start, end];
  const PP = [prevStart, prevEnd];

  const [
    cur, prev, newCust, prevNewCust, totalsRes, allTimeRes,
    byDayRes, byStatusRes, byCategoryRes, topProdRes, topCustRes,
    recentRes, lowStockRes, todoRes,
  ] = await Promise.all([
    db.query(`
      SELECT COUNT(*) FILTER (WHERE status <> 'cancelled')                 AS orders,
             COUNT(*) FILTER (WHERE status =  'cancelled')                 AS cancelled,
             COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)  AS revenue
        FROM orders WHERE created_at >= $1 AND created_at < $2
    `, P),
    db.query(`
      SELECT COUNT(*) FILTER (WHERE status <> 'cancelled')                 AS orders,
             COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)  AS revenue
        FROM orders WHERE created_at >= $1 AND created_at < $2
    `, PP),
    db.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer' AND created_at >= $1 AND created_at < $2`, P),
    db.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer' AND created_at >= $1 AND created_at < $2`, PP),
    db.query(`
      SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'cancelled'
    `, P),
    db.query(`
      SELECT (SELECT COUNT(*) FROM products)                                  AS products,
             (SELECT COUNT(*) FROM products WHERE stock < $1)                 AS low_stock,
             (SELECT COUNT(*) FROM users)                                     AS users,
             (SELECT COUNT(*) FROM users WHERE role = 'customer')             AS customers
    `, [LOW_STOCK_THRESHOLD]),
    db.query(`
      SELECT TO_CHAR(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS date,
             COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
        FROM orders
       WHERE created_at >= $1 AND created_at < $2 AND status <> 'cancelled'
       GROUP BY date ORDER BY date
    `, P),
    db.query(`
      SELECT status, COUNT(*)::int AS count FROM orders
       WHERE created_at >= $1 AND created_at < $2
       GROUP BY status
    `, P),
    db.query(`
      SELECT COALESCE(c.name, 'Chưa phân loại') AS category,
             SUM(oi.quantity)::int              AS sold,
             SUM(oi.quantity * oi.price)::bigint AS revenue
        FROM order_items oi
        JOIN orders o     ON o.id = oi.order_id AND o.status <> 'cancelled'
        LEFT JOIN products p   ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
       WHERE o.created_at >= $1 AND o.created_at < $2
       GROUP BY c.name ORDER BY revenue DESC
    `, P),
    db.query(`
      SELECT oi.product_id AS id, oi.name, MIN(p.img) AS img,
             SUM(oi.quantity)::int               AS sold,
             SUM(oi.quantity * oi.price)::bigint AS revenue
        FROM order_items oi
        JOIN orders o   ON o.id = oi.order_id AND o.status <> 'cancelled'
        LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.created_at >= $1 AND o.created_at < $2
       GROUP BY oi.product_id, oi.name
       ORDER BY sold DESC LIMIT 5
    `, P),
    db.query(`
      SELECT COALESCE(NULLIF(o.customer_name, ''), u.name, 'Khách mua lẻ') AS name,
             COALESCE(NULLIF(o.customer_phone, ''), u.phone, '')           AS phone,
             COUNT(*)::int                AS orders,
             COALESCE(SUM(o.total), 0)::bigint AS spent
        FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'cancelled'
       GROUP BY 1, 2 ORDER BY spent DESC LIMIT 5
    `, P),
    db.query(`
      SELECT o.id, o.created_at, o.total, o.status,
             COALESCE(NULLIF(o.customer_name, ''), u.name, 'Khách mua lẻ') AS customer_name
        FROM orders o LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 6
    `),
    db.query(`
      SELECT id, name, sku, stock, sold FROM products
       WHERE stock < $1 ORDER BY stock ASC LIMIT 6
    `, [LOW_STOCK_THRESHOLD]),
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE status IN ('pending','confirmed','processing')) AS pending_orders,
        (SELECT COUNT(*) FROM order_returns WHERE status = 'pending')                      AS pending_returns,
        (SELECT COUNT(*) FROM consultation_requests WHERE status = 'new')                  AS new_consultations,
        (SELECT COALESCE(SUM(staff_unread), 0) FROM chat_conversations)                    AS unread_chats
    `),
  ]);

  const n = (v) => parseInt(v, 10) || 0;
  const revenue = n(cur.rows[0].revenue);
  const orders = n(cur.rows[0].orders);
  const prevRevenue = n(prev.rows[0].revenue);
  const prevOrders = n(prev.rows[0].orders);
  const aov = orders > 0 ? Math.round(revenue / orders) : 0;
  const prevAov = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;
  const customersNew = n(newCust.rows[0].c);
  const prevCustomersNew = n(prevNewCust.rows[0].c);
  const t = totalsRes.rows[0];
  const a = allTimeRes.rows[0];
  const todo = todoRes.rows[0];

  const revenueByDay = fillDays(byDayRes.rows, start, end);
  const categoryTotal = byCategoryRes.rows.reduce((s, r) => s + n(r.revenue), 0);

  return {
    // ── Khoảng thời gian đang xem ────────────────────────────────────────────
    period: {
      from: ymd(start),
      to: ymd(new Date(end.getTime() - 86_400_000)),
      days: Math.round(spanMs / 86_400_000),
    },

    // ── Chỉ số chính, kèm so sánh với kỳ trước cùng độ dài ───────────────────
    kpi: {
      revenue, orders,
      cancelledOrders: n(cur.rows[0].cancelled),
      itemsSold: n(t.items_sold),
      avgOrderValue: aov,
      newCustomers: customersNew,
      prev: { revenue: prevRevenue, orders: prevOrders, avgOrderValue: prevAov, newCustomers: prevCustomersNew },
      growth: {
        revenue: growth(revenue, prevRevenue),
        orders: growth(orders, prevOrders),
        avgOrderValue: growth(aov, prevAov),
        newCustomers: growth(customersNew, prevCustomersNew),
      },
    },

    // ── Số liệu toàn thời gian ───────────────────────────────────────────────
    totals: {
      products: n(a.products),
      lowStockCount: n(a.low_stock),
      users: n(a.users),
      customers: n(a.customers),
    },

    // ── Việc đang chờ xử lý — bấm vào là sang đúng tab ───────────────────────
    todo: {
      pendingOrders: n(todo.pending_orders),
      pendingReturns: n(todo.pending_returns),
      newConsultations: n(todo.new_consultations),
      unreadChats: n(todo.unread_chats),
      lowStock: n(a.low_stock),
    },

    revenueByDay,
    ordersByStatus: byStatusRes.rows.map(r => ({ status: r.status, count: r.count })),
    revenueByCategory: byCategoryRes.rows.map(r => ({
      category: r.category,
      sold: r.sold,
      revenue: n(r.revenue),
      share: categoryTotal > 0 ? Math.round((n(r.revenue) / categoryTotal) * 1000) / 10 : 0,
    })),
    topProducts: topProdRes.rows.map(r => ({
      id: r.id, name: r.name, img: r.img, sold: r.sold, revenue: n(r.revenue),
    })),
    topCustomers: topCustRes.rows.map(r => ({
      name: r.name, phone: r.phone, orders: r.orders, spent: n(r.spent),
    })),
    recentOrders: recentRes.rows.map(r => ({
      id: r.id, customerName: r.customer_name, total: r.total,
      status: r.status, createdAt: r.created_at,
    })),
    lowStock: lowStockRes.rows,

    // ── Trường phẳng giữ lại cho phần giao diện cũ ───────────────────────────
    totalRevenue: revenue,
    totalOrders: orders,
    totalProducts: n(a.products),
    totalUsers: n(a.users),
    totalCustomers: n(a.customers),
    lowStockCount: n(a.low_stock),
    avgOrderValue: aov,
  };
}
