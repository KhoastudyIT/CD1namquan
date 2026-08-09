import { Link, useNavigate } from "react-router-dom";
import { Icon, telHref } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import { useAppContext, useSettings } from "../context.js";

export function Drawer({ open, onClose }) {
  const { user, logout } = useAppContext();
  const settings = useSettings();
  const navigate = useNavigate();
  const links = [
    { label: "Cửa hàng", path: "/shop", icon: "cart" },
    { label: "Bộ sưu tập", hash: "collections", icon: "shield" },
    { label: "Showroom", hash: "showroom", icon: "pin" },
    { label: "Tin tức", path: "/news", icon: "arrowR" },
  ];

  const handleNav = (link) => {
    onClose();
    if (link.path) {
      navigate(link.path);
      window.scrollTo(0, 0);
    } else {
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => document.getElementById(link.hash)?.scrollIntoView({ behavior: "smooth" }), 300);
      } else {
        document.getElementById(link.hash)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className={"drawer" + (open ? " open" : "")}>
      <div className="drawer-bg" onClick={onClose}></div>
      <div className="drawer-panel">
        <div className="drawer-header">
          <Logo />
          <button className="drawer-close" onClick={onClose} aria-label="Đóng"><Icon name="close" size={20} /></button>
        </div>

        {user ? (
          <div className="drawer-user-card">
            <div className="drawer-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</div>
            <div className="drawer-user-info">
              <span className="drawer-user-name">Chào, {user.name}</span>
              {user.role === 'admin' ? (
                <span className="drawer-user-role">⚙ Quản trị viên</span>
              ) : (
                <Link to="/account" onClick={onClose} className="drawer-user-link">Xem tài khoản ›</Link>
              )}
            </div>
          </div>
        ) : (
          <div className="drawer-welcome">
            <span>Chào mừng bạn đến với <b>{settings.companyName}</b></span>
          </div>
        )}

        <nav className="drawer-nav">
          {links.map((l) => (
            <a key={l.label} href="#" onClick={(e) => { e.preventDefault(); handleNav(l); }} className="drawer-item">
              <span className="drawer-item-left">
                <Icon name={l.icon} size={18} />
                <span>{l.label}</span>
              </span>
              <Icon name="arrowR" size={14} style={{ color: "var(--muted)" }} />
            </a>
          ))}
        </nav>

        <div className="drawer-actions">
          {user ? (
            <button className="btn-pill" onClick={() => { logout(); onClose(); }} style={{ width: "100%", justifyContent: "center", background: "#fff1f0", color: "#ff4d4f", border: "1px solid #ffccc7" }}>
              Đăng xuất
            </button>
          ) : (
            <Link to="/login" className="btn-pill" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
              <Icon name="user" size={16} /> Đăng nhập
            </Link>
          )}
        </div>

        {settings.phone && (
          <div className="drawer-footer">
            <a className="drawer-contact" href={telHref(settings.phone)}>
              <Icon name="phone" size={14} /> <span>Hotline: <b>{settings.phone}</b></span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
