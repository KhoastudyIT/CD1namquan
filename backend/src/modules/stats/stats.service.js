import db from '../../db/index.js';

const LOW_STOCK_THRESHOLD = 10;

export async function getOverview() {
  const [
    ordersAggr,
    usersAggr,
    productsAggr,
    ordersByStatusRes,
    revenueByDayRes,
    topProductsRes
  ] = await Promise.all([
    db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status != 'cancelled') as paid_orders,
        COALESCE(SUM(total) FILTER (WHERE status != 'cancelled'), 0) as total_revenue
      FROM orders
    `),
    db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'customer') as total_customers
      FROM users
    `),
    db.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE stock < $1) as low_stock_count
      FROM products
    `, [LOW_STOCK_THRESHOLD]),
    db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `),
    db.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date ASC
    `),
    db.query(`
      SELECT id, name, img, sold, (sold::bigint * price) as revenue
      FROM products
      ORDER BY sold DESC
      LIMIT 5
    `)
  ]);

  const totalRevenue = parseInt(ordersAggr.rows[0].total_revenue, 10);
  const paidOrders = parseInt(ordersAggr.rows[0].paid_orders, 10);

  const ordersByStatus = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const row of ordersByStatusRes.rows) {
    ordersByStatus[row.status] = parseInt(row.count, 10);
  }

  const revenueByDayRaw = revenueByDayRes.rows;
  // Fill missing days
  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const found = revenueByDayRaw.find(r => r.date === key);
    revenueByDay.push({
      date: key,
      revenue: found ? parseInt(found.revenue, 10) : 0,
      orders: found ? parseInt(found.orders, 10) : 0,
    });
  }

  return {
    totalRevenue,
    totalOrders: parseInt(ordersAggr.rows[0].total_orders, 10),
    totalProducts: parseInt(productsAggr.rows[0].total_products, 10),
    totalUsers: parseInt(usersAggr.rows[0].total_users, 10),
    totalCustomers: parseInt(usersAggr.rows[0].total_customers, 10),
    lowStockCount: parseInt(productsAggr.rows[0].low_stock_count, 10),
    avgOrderValue: paidOrders > 0 ? Math.round(totalRevenue / paidOrders) : 0,
    ordersByStatus,
    revenueByDay,
    topProducts: topProductsRes.rows.map(r => ({ ...r, sold: parseInt(r.sold, 10), revenue: parseInt(r.revenue, 10) })),
  };
}

