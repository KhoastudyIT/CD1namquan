import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon, vnd } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";
import { useAppContext } from "../context.js";
import { api } from "../api.js";

import { orderStatusLabel, orderStatusClass } from "../utils/orderStatus.js";

export function AccountOverview() {
  const { user, cart, favs } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stale = false;
    api.getOrders()
      .then((data) => { if (!stale) setOrders(Array.isArray(data) ? data : []); })
      .catch(() => { if (!stale) setOrders([]); })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, []);

  // Đơn đã hủy không phải tiền đã tiêu nên không tính vào tổng chi tiêu.
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const stats = [
    { label: "Đơn hàng", value: orders.length, icon: "truck", to: "/account/orders" },
    { label: "Giỏ hàng", value: cartCount, icon: "cart", to: "/account/cart" },
    { label: "Yêu thích", value: favs.size, icon: "heart", to: "/account/favorites" },
    { label: "Tổng chi tiêu", value: `${vnd(totalSpent)}đ`, icon: "star", to: "/account/orders" },
  ];

  return (
    <>
      <AccountHeader
        title={`Chào ${user.name}`}
        desc="Tổng quan tài khoản của bạn tại NAM QUAN"
      />

      <div className="acc-stats">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="acc-stat">
            <div className="acc-stat-top">
              <Icon name={s.icon} size={16} />
              <span>{s.label}</span>
            </div>
            <b>{loading ? "—" : s.value}</b>
          </Link>
        ))}
      </div>

      <div className="acc-card">
        <div className="acc-card-head">
          <h2>Đơn hàng gần đây</h2>
          {orders.length > 5 && <Link to="/account/orders">Xem tất cả</Link>}
        </div>

        {loading ? (
          <p className="acc-muted">Đang tải…</p>
        ) : orders.length === 0 ? (
          <div className="acc-empty">
            <Icon name="truck" size={34} />
            <p>Bạn chưa đặt đơn hàng nào</p>
            <Link to="/shop" className="btn-pill">Bắt đầu mua sắm</Link>
          </div>
        ) : (
          <ul className="acc-order-list">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link to={`/account/orders/${o.id}`}>
                  <div className="acc-order-id">
                    <b>Đơn #{String(o.id).split("-")[0].toUpperCase()}</b>
                    <span>
                      {new Date(o.createdAt).toLocaleDateString("vi-VN")} · {o.items?.length ?? 0} sản phẩm
                    </span>
                  </div>
                  <div className="acc-order-right">
                    <span className={"acc-status acc-status-" + orderStatusClass(o)}>
                      {orderStatusLabel(o)}
                    </span>
                    <b>{vnd(o.total)}đ</b>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
