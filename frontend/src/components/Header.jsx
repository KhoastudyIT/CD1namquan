import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import { NotificationsBell } from "./NotificationsBell.jsx";
import { useAppContext } from "../context.js";

export function Header({ cartCount, favCount, onMenu }) {
  const { user, logout, requireLogin } = useAppContext();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Icons that need an account: show the login popup for guests.
  const guardNav = (path, message) => {
    if (requireLogin(message, path)) navigate(path);
  };
  const links = [
    { label: "Trang chủ", path: "/" },
    { label: "Cửa hàng", path: "/shop" },
    { label: "Bộ sưu tập", hash: "collections" },
    { label: "Showroom", hash: "showroom" },
    { label: "Tin tức", path: "/news" }
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

  useEffect(() => {
    if (!showSearch) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  return (
    <>
      <header className="hdr" id="top">
        <div className="hdr-in">
          <Link to={isAdmin ? "/admin" : "/"} style={{display: 'flex', alignItems: 'center'}}><Logo /></Link>
          {!isAdmin && (
            <nav className="nav">
              {links.map((l) => (
                <a key={l.label} href="#" onClick={(e) => handleNav(e, l)}>{l.label}</a>
              ))}
            </nav>
          )}
          <div className="hdr-r" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isAdmin && (
              <>
                <button className="icon-btn" aria-label="Tìm kiếm" onClick={() => setShowSearch(true)}><Icon name="search" size={19} /></button>
                <NotificationsBell />
                <button className="icon-btn" aria-label="Yêu thích" onClick={() => guardNav('/favorites', 'Vui lòng đăng nhập để xem sản phẩm yêu thích.')}>
                  <Icon name="heart" size={19} />{user && favCount > 0 && <span className="badge">{favCount}</span>}
                </button>
                <button className="icon-btn" aria-label="Giỏ hàng" onClick={() => guardNav('/cart', 'Vui lòng đăng nhập để xem giỏ hàng của bạn.')}>
                  <Icon name="cart" size={19} />{cartCount > 0 && <span className="badge">{cartCount}</span>}
                </button>
              </>
            )}
            {user ? (
              <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 10 }}>
                {isAdmin && (
                  <span className="btn-pill" style={{ background: 'var(--gold)', color: '#fff', padding: '6px 14px', fontSize: 13, boxShadow: '0 4px 10px rgba(201,168,106,.2)' }}>
                    ⚙ Quản trị viên
                  </span>
                )}
                {!isAdmin && (
                  <Link className="hdr-greeting hdr-user" to="/profile" title={user.name}>
                    <span className="hdr-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                    <span className="hdr-user-name">{user.name}</span>
                  </Link>
                )}
                {isAdmin && (
                  <span className="hdr-user" title={user.name}>
                    <span className="hdr-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                    <span className="hdr-user-name">{user.name}</span>
                  </span>
                )}
                <button className="btn-pill ghost" onClick={logout} style={{ padding: "0 10px" }}>Thoát</button>
              </div>
            ) : (
              <Link className="btn-pill ghost" to="/login" style={{ marginLeft: 10 }}><Icon name="user" size={16} />Đăng nhập</Link>
            )}
            {!isAdmin && <button className="icon-btn burger" aria-label="Menu" onClick={onMenu}><Icon name="menu" size={22} /></button>}
          </div>
        </div>

        {showSearch && (
          <div className="hdr-search-overlay">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '600px', background: '#f5f5f5', borderRadius: '999px', padding: '8px 18px', gap: '10px' }}>
              <Icon name="search" size={18} style={{ color: 'var(--muted)' }} />
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '15px', color: 'var(--ink)' }}
              />
              <button type="button" onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'grid', placeItems: 'center' }}>
                <Icon name="close" size={16}/>
              </button>
            </form>
          </div>
        )}
      </header>
      {showSearch && <div className="search-backdrop" onClick={() => setShowSearch(false)} />}
    </>
  );
}
