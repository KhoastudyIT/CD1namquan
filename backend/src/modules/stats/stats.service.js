import { orders, products, users } from '../../db/store.js';

const LOW_STOCK_THRESHOLD = 10;

/** Admin dashboard analytics computed from the in-memory stores. */
export function getOverview() {
  const allOrders   = [...orders.values()];
  const allProducts = [...products.values()];
  const allUsers    = [...users.values()];

  const paidOrders = allOrders.filter(o => o.status !== 'cancelled');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const ordersByStatus = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  for (const o of allOrders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
  }

  // Revenue for the last 7 days (oldest -> newest), keyed by ISO date.
  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const dayOrders = paidOrders.filter(o => o.createdAt.slice(0, 10) === key);
    revenueByDay.push({
      date:    key,
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders:  dayOrders.length,
    });
  }

  // Top products by units sold, revenue derived from current price.
  const topProducts = allProducts
    .map(p => ({ id: p.id, name: p.name, img: p.img, sold: p.sold ?? 0, revenue: (p.sold ?? 0) * p.price }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders:    allOrders.length,
    totalProducts:  allProducts.length,
    totalUsers:     allUsers.length,
    totalCustomers: allUsers.filter(u => u.role === 'customer').length,
    lowStockCount:  allProducts.filter(p => p.stock < LOW_STOCK_THRESHOLD).length,
    avgOrderValue:  paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0,
    ordersByStatus,
    revenueByDay,
    topProducts,
  };
}
