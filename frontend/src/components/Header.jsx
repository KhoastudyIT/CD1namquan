import { Icon } from "./ui.jsx";
import { Logo } from "./Logo.jsx";

export function Header({ cartCount, favCount, onMenu }) {
  const links = ["Mua ngay", "Bộ sưu tập", "Showroom", "Tin tức", "Liên hệ"];
  const toShowroom = () => document.getElementById("showroom").scrollIntoView({ behavior: "smooth" });
  return (
    <header className="hdr" id="top">
      <div className="hdr-in">
        <Logo />
        <nav className="nav">
          {links.map((l) => <a key={l} href="#showroom">{l}</a>)}
        </nav>
        <div className="hdr-r">
          <button className="icon-btn" aria-label="Tìm kiếm"><Icon name="search" size={19} /></button>
          <button className="icon-btn" aria-label="Thông báo"><Icon name="bell" size={19} /><span className="badge">3</span></button>
          <button className="icon-btn" aria-label="Yêu thích" onClick={toShowroom}>
            <Icon name="heart" size={19} />{favCount > 0 && <span className="badge">{favCount}</span>}
          </button>
          <button className="icon-btn" aria-label="Giỏ hàng"><Icon name="cart" size={19} />{cartCount > 0 && <span className="badge">{cartCount}</span>}</button>
          <a className="btn-pill ghost" href="#cta"><Icon name="user" size={16} />Đăng nhập</a>
          <button className="icon-btn burger" aria-label="Menu" onClick={onMenu}><Icon name="menu" size={22} /></button>
        </div>
      </div>
    </header>
  );
}
