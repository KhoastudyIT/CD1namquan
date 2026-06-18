import { useState, useCallback, useEffect } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { useReveal, toast } from "./components/ui.jsx";
import { Header } from "./components/Header.jsx";
import { Drawer } from "./components/Drawer.jsx";
import { Footer } from "./components/Footer.jsx";
import { AppContext } from "./context.js";
import { api } from "./api.js";

import { Home } from "./pages/Home.jsx";
import { Cart } from "./pages/Cart.jsx";
import { Login } from "./pages/Login.jsx";
import { Register } from "./pages/Register.jsx";
import { Shop } from "./pages/Shop.jsx";
import { ProductDetail } from "./pages/ProductDetail.jsx";
import { Checkout } from "./pages/Checkout.jsx";
import { Orders } from "./pages/Orders.jsx";
import { OrderDetail } from "./pages/OrderDetail.jsx";
import { Profile } from "./pages/Profile.jsx";
import { Favorites } from "./pages/Favorites.jsx";
import { Notifications } from "./pages/Notifications.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [favs, setFavs] = useState(() => {
    try {
      const saved = localStorage.getItem("favs");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  useReveal();

  const fetchCart = useCallback(() => {
    if (!localStorage.getItem('token')) return;
    api.getCart().then(data => {
      if (data && data.items) setCart(data.items);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe().then(data => {
        if (data) setUser(data);
      }).catch(() => {
        localStorage.removeItem('token');
      });
      fetchCart();
    }
  }, [fetchCart]);

  const addToCart = useCallback((p, quantity = 1) => {
    if (!localStorage.getItem('token')) {
      toast("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate('/login');
      return;
    }
    const targetId = Number(p.productId || p.id);
    api.addToCart(targetId, Number(quantity)).then(data => {
      if (data) {
        toast(`🛒 Đã thêm ${quantity} “${p.name}” vào giỏ hàng`);
        fetchCart();
      }
    }).catch(err => {
      toast(err.message || "Lỗi khi thêm vào giỏ");
    });
  }, [navigate, fetchCart]);

  const toggleFav = useCallback((id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); toast("❤ Đã thêm vào yêu thích"); }
      localStorage.setItem("favs", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart([]);
    navigate('/');
    toast("Đã đăng xuất");
  };

  const contextValue = { user, setUser, cart, fetchCart, favs, toggleFav, addToCart, logout };
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AppContext.Provider value={contextValue}>
      <Header cartCount={cartCount} favCount={favs.size} onMenu={() => setMenu(true)} />
      <Drawer open={menu} onClose={() => setMenu(false)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={
            user && user.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfdfb' }}>
                <div style={{ textAlign: 'center', maxWidth: 450, padding: 30, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
                  <h2 style={{ color: '#ff4d4f', marginBottom: 15 }}>Từ chối truy cập</h2>
                  <p style={{ color: 'var(--muted)', marginBottom: 25, fontSize: 15, lineHeight: 1.6 }}>Bạn không có quyền quản trị viên để truy cập trang này. Vui lòng đăng nhập bằng tài khoản quản trị.</p>
                  <Link to="/login" className="btn-pill" style={{ justifyContent: 'center' }}>Đăng nhập Admin</Link>
                </div>
              </div>
            )
          } />
        </Routes>
      </main>
      <Footer />
    </AppContext.Provider>
  );
}
