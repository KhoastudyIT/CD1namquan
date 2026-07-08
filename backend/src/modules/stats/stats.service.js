import { products, orders, users } from '../../db/store.js';

/**
 * Tính thống kê tổng quan cho Admin Dashboard.
 * Schema: StatsOverview
 */
export function getStatsOverview() {
  const allOrders = [...orders.values()];
  const allProducts = [...products.values()];
  const allUsers = [...users.values()];

  // ── Các chỉ số cơ bản ───────────────────────────────────────────
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter(p => p.stock < 10).length;
  const totalUsers = allUsers.filter(u => u.role === 'customer').length;
  const totalCustomers = totalUsers; // alias
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ── ordersByStatus ───────────────────────────────────────────────
  const statusList = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const ordersByStatus = statusList.map(status => ({
    status,
    count: allOrders.filter(o => o.status === status).length,
  }));

  // ── revenueByDay (7 ngày gần nhất) ──────────────────────────────
  const now = new Date();
  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dateStr = day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const revenue = allOrders
      .filter(o => {
        const t = new Date(o.createdAt);
        return o.status !== 'cancelled' && t >= dayStart && t < dayEnd;
      })
      .reduce((sum, o) => sum + o.total, 0);

    revenueByDay.push({ date: dateStr, revenue });
  }

  // ── topProducts (top 5 bán chạy theo sold) ──────────────────────
  const topProducts = allProducts
    .slice()
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, sold: p.sold, img: p.img, price: p.price }));

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockCount,
    totalUsers,
    totalCustomers,
    avgOrderValue,
    ordersByStatus,
    revenueByDay,
    topProducts,
  };
}
