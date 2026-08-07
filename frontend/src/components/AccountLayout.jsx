import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon } from "./ui.jsx";
import { useAppContext } from "../context.js";

/**
 * Khung chung cho khu vực tài khoản: sidebar cố định bên trái, nội dung trang
 * con render vào <Outlet/>. Dưới 900px sidebar ẩn đi, thay bằng nút mở panel
 * trượt — cùng cách làm với Drawer của header.
 *
 * `count` là khoá tra số lượng, chỉ vài mục mới có badge.
 */
const NAV_ITEMS = [
  { label: "Tổng quan", to: "/account", icon: "grid", end: true },
  { label: "Đơn hàng", to: "/account/orders", icon: "truck" },
  { label: "Giỏ hàng", to: "/account/cart", icon: "cart", count: "cart" },
  { label: "Yêu thích", to: "/account/favorites", icon: "heart", count: "favs" },
  { label: "Thông báo", to: "/account/notifications", icon: "bell", count: "notifs" },
  { label: "Tin nhắn", to: "/account/messages", icon: "chat" },
  { label: "Chính sách", to: "/account/policies", icon: "shield" },
  { label: "Hồ sơ", to: "/account/profile", icon: "user" },
  { label: "Cài đặt", to: "/account/settings", icon: "gear" },
];

export function AccountLayout() {
  const { user, logout, cart, favs, notifs } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const counts = {
    cart: cart.reduce((sum, item) => sum + item.quantity, 0),
    favs: favs.size,
    notifs: notifs.filter((n) => !n.read).length,
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const sidebar = (
    <>
      <div className="acc-side-head">
        <div className="acc-side-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</div>
        <div className="acc-side-id">
          <b title={user.name}>{user.name}</b>
          <span title={user.email}>{user.email}</span>
        </div>
      </div>

      <nav className="acc-nav">
        {NAV_ITEMS.map((item) => {
          const count = item.count ? counts[item.count] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => "acc-nav-item" + (isActive ? " active" : "")}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {count > 0 && <span className="acc-nav-count">{count > 99 ? "99+" : count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="acc-side-foot">
        <button className="acc-logout" onClick={handleLogout}>
          <Icon name="close" size={16} /> Đăng xuất
        </button>
      </div>
    </>
  );

  const current = NAV_ITEMS.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)));

  return (
    <section className="section acc-section">
      <div className="wrap">
        <button className="acc-menu-btn" onClick={() => setMenuOpen(true)}>
          <Icon name="menu" size={16} /> {current ? current.label : "Menu tài khoản"}
        </button>

        <div className="acc-layout">
          <aside className="acc-sidebar">{sidebar}</aside>
          <div className="acc-content">
            <Outlet />
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="acc-drawer">
          <div className="acc-drawer-bg" onClick={() => setMenuOpen(false)} />
          <div className="acc-drawer-panel">
            <button className="acc-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Đóng">
              <Icon name="close" size={18} />
            </button>
            {sidebar}
          </div>
        </div>
      )}
    </section>
  );
}

/** Tiêu đề dùng chung cho mọi trang con, để các trang không tự chế mỗi nơi một kiểu. */
export function AccountHeader({ title, desc, action }) {
  return (
    <div className="acc-head">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  );
}
