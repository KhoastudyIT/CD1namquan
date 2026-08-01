import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./ui.jsx";
import { useAppContext } from "../context.js";

export function Drawer({ open, onClose }) {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const links = [
    { label: "Cửa hàng", path: "/shop" },
    { label: "Bộ sưu tập", hash: "collections" },
    { label: "Showroom", hash: "showroom" },
    { label: "Tin tức", path: "/news" },
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
        <button className="drawer-close" onClick={onClose}><Icon name="close" size={22} /></button>
        {links.map((l) => (
          <a key={l.label} href="#" onClick={(e) => { e.preventDefault(); handleNav(l); }}>{l.label}</a>
        ))}
        {user ? (
          <button className="btn-pill" onClick={() => { logout(); onClose(); }} style={{ marginTop: 14, justifyContent: "center" }}>Đăng xuất</button>
        ) : (
          <Link to="/login" className="btn-pill" onClick={onClose} style={{ marginTop: 14, justifyContent: "center" }}>Đăng nhập</Link>
        )}
      </div>
    </div>
  );
}
