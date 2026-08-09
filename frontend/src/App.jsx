import { useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { useReveal, toast } from "./components/ui.jsx";
import { Header } from "./components/Header.jsx";
import { Drawer } from "./components/Drawer.jsx";
import { Footer } from "./components/Footer.jsx";
import { AppContext } from "./context.js";
import { api, DEFAULT_SETTINGS } from "./api.js";

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
import { NewsList } from "./pages/NewsList.jsx";
import { NewsDetail } from "./pages/NewsDetail.jsx";
import { Favorites } from "./pages/Favorites.jsx";
import { Notifications } from "./pages/Notifications.jsx";
import { Policies, AccountPolicies } from "./pages/Policies.jsx";
import { AccountLayout } from "./components/AccountLayout.jsx";
import { AccountOverview } from "./pages/AccountOverview.jsx";
import { AccountMessages } from "./pages/AccountMessages.jsx";
import { AccountSettings } from "./pages/AccountSettings.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { RequireAuth } from "./components/RequireAuth.jsx";
import { LoginModal } from "./components/LoginModal.jsx";
import { ChatWidget } from "./components/ChatWidget.jsx";

/** Giữ lại :id khi chuyển tiếp /orders/:id sang khu vực tài khoản. */
function RedirectOrderDetail() {
  const { id } = useParams();
  return <Navigate to={`/account/orders/${id}`} replace />;
}

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
  const [loginPrompt, setLoginPrompt] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  // Sản phẩm được gắn kèm khi khách bấm "Hỏi tư vấn" từ trang chi tiết —
  // gửi kèm tin nhắn đầu tiên để bot biết chắc đang nói về mẫu nào.
  const [chatProduct, setChatProduct] = useState(null);
  // Thông tin công ty dùng chung cho Header, Footer và Drawer. Tải một lần ở
  // đây rồi phát qua context — mỗi component tự gọi API sẽ thành 3 request
  // trùng nhau cho cùng một dòng dữ liệu.
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const navigate = useNavigate();
  const location = useLocation();

  useReveal();

  // Opens the "please log in" popup. Returns true when the user is allowed
  // to proceed (already logged in), false when the popup was shown instead.
  const requireLogin = useCallback((message, redirectTo) => {
    if (localStorage.getItem('token')) return true;
    setLoginPrompt({ message, redirectTo });
    return false;
  }, []);

  const fetchCart = useCallback(() => {
    if (!localStorage.getItem('token')) return;
    api.getCart().then(data => {
      if (data && data.items) setCart(data.items);
    }).catch(() => {});
  }, []);

  const fetchNotifs = useCallback(() => {
    if (!localStorage.getItem('token')) return;
    api.getNotifications().then(data => {
      if (Array.isArray(data)) setNotifs(data);
    }).catch(() => {});
  }, []);

  const markNotifRead = useCallback((id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    api.markNotificationRead(id).catch(() => {});
  }, []);

  // Admin lưu xong gọi lại hàm này để Header/Footer đổi ngay, khỏi phải F5.
  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch {
      // Giữ nguyên giá trị đang có — thà hiện thông tin cũ còn hơn để trống.
    }
  }, []);

  useEffect(() => { refreshSettings(); }, [refreshSettings]);

  // Tên tab trình duyệt cũng là thông tin nhận diện, đổi theo cấu hình luôn.
  useEffect(() => {
    if (!settings.companyName) return;
    document.title = settings.slogan
      ? `${settings.companyName} — ${settings.slogan}`
      : settings.companyName;
  }, [settings.companyName, settings.slogan]);

  const markAllNotifsRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    api.markAllNotificationsRead().catch(() => {});
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
      fetchNotifs();
    }
  }, [fetchCart, fetchNotifs]);

  const addToCart = useCallback((p, quantity = 1) => {
    if (!requireLogin("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.", "/cart")) return;
    const targetId = Number(p.product_id || p.productId || p.id);
    api.addToCart(targetId, Number(quantity)).then(data => {
      if (data) {
        toast(`🛒 Đã thêm ${quantity} “${p.name}” vào giỏ hàng`);
        fetchCart();
      }
    }).catch(err => {
      toast(err.message || "Lỗi khi thêm vào giỏ");
    });
  }, [requireLogin, fetchCart]);

  const toggleFav = useCallback((id) => {
    if (!requireLogin("Vui lòng đăng nhập để lưu sản phẩm yêu thích.", "/favorites")) return;
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); toast("❤ Đã thêm vào yêu thích"); }
      localStorage.setItem("favs", JSON.stringify([...next]));
      return next;
    });
  }, [requireLogin]);

  const openChat = useCallback((product = null) => {
    if (!requireLogin("Vui lòng đăng nhập để chat với tư vấn viên.", "/")) return;
    setChatProduct(product);
    setChatOpen(true);
  }, [requireLogin]);

  // Thông báo "nhân viên đã phản hồi" trỏ về /?chat=1 — mở sẵn khung chat rồi
  // dọn query khỏi URL để F5 sau đó không tự bật lại.
  useEffect(() => {
    if (new URLSearchParams(location.search).get("chat") !== "1") return;
    openChat();
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, navigate, openChat]);

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // ignore API errors and continue clearing local state
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setCart([]);
      setNotifs([]);
      setChatOpen(false);
      setChatProduct(null);
      navigate('/');
      toast("Đã đăng xuất");
    }
  };

  const contextValue = { user, setUser, cart, fetchCart, favs, toggleFav, addToCart, logout, requireLogin, notifs, fetchNotifs, markNotifRead, markAllNotifsRead, openChat, settings, refreshSettings };
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = user?.role === 'admin';

  return (
    <AppContext.Provider value={contextValue}>
      <Header cartCount={cartCount} favCount={favs.size} onMenu={() => setMenu(true)} />
      {!isAdmin && <Drawer open={menu} onClose={() => setMenu(false)} />}
      <main>
        {isAdmin ? (
          /* Admin sees only the dashboard; any other path goes back to it. */
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/news" element={<NewsList />} />
          <Route path="/news/:idOrSlug" element={<NewsDetail />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

          {/* Khu vực tài khoản: sidebar dùng chung, trang con render vào Outlet */}
          <Route path="/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
            <Route index element={<AccountOverview />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="messages" element={<AccountMessages />} />
            <Route path="policies" element={<AccountPolicies />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>

          {/* Đường dẫn cũ vẫn còn trong bookmark và link ngoài — chuyển tiếp thay vì 404 */}
          <Route path="/cart" element={<Navigate to="/account/cart" replace />} />
          <Route path="/orders" element={<Navigate to="/account/orders" replace />} />
          <Route path="/orders/:id" element={<RedirectOrderDetail />} />
          <Route path="/profile" element={<Navigate to="/account/profile" replace />} />
          <Route path="/favorites" element={<Navigate to="/account/favorites" replace />} />
          <Route path="/notifications" element={<Navigate to="/account/notifications" replace />} />

          <Route path="/policies" element={<Policies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={
            <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfdfb' }}>
              <div style={{ textAlign: 'center', maxWidth: 450, padding: 30, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ color: '#ff4d4f', marginBottom: 15 }}>Từ chối truy cập</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 25, fontSize: 15, lineHeight: 1.6 }}>Bạn không có quyền quản trị viên để truy cập trang này. Vui lòng đăng nhập bằng tài khoản quản trị.</p>
                <Link to="/login" className="btn-pill" style={{ justifyContent: 'center' }}>Đăng nhập Admin</Link>
              </div>
            </div>
          } />
          <Route path="*" element={
            <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfdfb' }}>
              <div style={{ textAlign: 'center', maxWidth: 450, padding: 30 }}>
                <h1 style={{ fontSize: 64, margin: 0, color: 'var(--green-ink)' }}>404</h1>
                <p style={{ color: 'var(--muted)', margin: '12px 0 24px', fontSize: 15 }}>Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
                <Link to="/" className="btn-pill" style={{ justifyContent: 'center' }}>Về trang chủ</Link>
              </div>
            </div>
          } />
        </Routes>
        )}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && (
        <ChatWidget
          open={chatOpen}
          setOpen={setChatOpen}
          product={chatProduct}
          clearProduct={() => setChatProduct(null)}
        />
      )}
      <LoginModal prompt={loginPrompt} onClose={() => setLoginPrompt(null)} />
    </AppContext.Provider>
  );
}
