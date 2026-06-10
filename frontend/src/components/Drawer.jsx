import { Icon } from "./ui.jsx";

export function Drawer({ open, onClose }) {
  const links = ["Mua ngay", "Bộ sưu tập", "Showroom", "Tin tức", "Liên hệ"];
  return (
    <div className={"drawer" + (open ? " open" : "")}>
      <div className="drawer-bg" onClick={onClose}></div>
      <div className="drawer-panel">
        <button className="drawer-close" onClick={onClose}><Icon name="close" size={22} /></button>
        {links.map((l) => <a key={l} href="#showroom" onClick={onClose}>{l}</a>)}
        <a href="#cta" onClick={onClose} className="btn-pill" style={{ marginTop: 14, justifyContent: "center" }}>Đăng nhập</a>
      </div>
    </div>
  );
}
