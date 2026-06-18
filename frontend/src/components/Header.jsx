import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import { useAppContext } from "../context.js";

export function Header({ cartCount, favCount, onMenu }) {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const links = [
    { label: "Cửa hàng", path: "/shop" },
    { label: "Bộ sưu tập", hash: "collections" },
    { label: "Showroom", hash: "showroom" },
    { label: "Tin tức", hash: "news" }
  ];
  
  const handleNav = (e, link) => {
    e.preventDefault();
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

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="hdr" id="top">
      <div className="hdr-in">
        <Link to="/" style={{display: 'flex', alignItems: 'center'}}><Logo /></Link>
        <nav className="nav">
          {links.map((l) => (
            <a key={l.label} href="#" onClick={(e) => handleNav(e, l)}>{l.label}</a>
          ))}
        </nav>
        <div className="hdr-r" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 20, padding: '4px 12px' }}>
              <input 
                autoFocus
                type="text" 
                placeholder="Tìm sản phẩm..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setShowSearch(false)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: 150, fontSize: 14 }}
              />
              <button type="button" onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Icon name="close" size={14}/></button>
            </form>
          ) : (
            <button className="icon-btn" aria-label="Tìm kiếm" onClick={() => setShowSearch(true)}><Icon name="search" size={19} /></button>
          )}
          <button className="icon-btn" aria-label="Thông báo" onClick={() => navigate('/notifications')}>
            <Icon name="bell" size={19} /><span className="badge">3</span>
          </button>
          <button className="icon-btn" aria-label="Yêu thích" onClick={() => navigate('/favorites')}>
            <Icon name="heart" size={19} />{favCount > 0 && <span className="badge">{favCount}</span>}
          </button>
          <button className="icon-btn" aria-label="Giỏ hàng" onClick={() => navigate('/cart')}>
            <Icon name="cart" size={19} />{cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          {user ? (
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 10 }}>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-pill" style={{ background: 'var(--gold)', color: '#fff', padding: '6px 14px', fontSize: 13, boxShadow: '0 4px 10px rgba(201,168,106,.2)' }}>
                  ⚙ Quản lý
                </Link>
              )}
              <Link to="/profile" style={{ fontSize: 14, fontWeight: 500 }}>Chào, {user.name}</Link>
              <button className="btn-pill ghost" onClick={logout} style={{ padding: "0 10px" }}>Thoát</button>
            </div>
          ) : (
            <Link className="btn-pill ghost" to="/login" style={{ marginLeft: 10 }}><Icon name="user" size={16} />Đăng nhập</Link>
          )}
          <button className="icon-btn burger" aria-label="Menu" onClick={onMenu}><Icon name="menu" size={22} /></button>
        </div>
      </div>
    </header>
  );
}
