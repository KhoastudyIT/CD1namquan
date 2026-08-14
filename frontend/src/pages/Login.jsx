import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { toast, Icon } from "../components/ui.jsx";
import { isBackoffice } from "../utils/roles.js";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, fetchCart, fetchNotifs } = useAppContext();
  const from = location.state?.from || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await api.login({ email, password });
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        fetchCart();
        fetchNotifs();
        toast("Đăng nhập thành công!");
        // Nhân viên cũng vào thẳng khu quản trị như admin.
        navigate(isBackoffice(data.user?.role) ? '/admin' : from, { replace: true });
      }
    } catch (err) {
      toast(err.message || "Đăng nhập thất bại");
    }
  };

  return (
    <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9faf9' }}>
      <div className="auth-box" style={{ maxWidth: 400, width: '100%', padding: 30, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Đăng nhập</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <div className="pwd-input-wrap">
            <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
            <button
              type="button"
              className="pwd-toggle-btn"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
          <button type="submit" className="btn-pill" style={{ width: '100%', justifyContent: 'center', background: 'var(--green)', color: '#fff', padding: 14 }}>Đăng nhập</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 15, fontSize: 14 }}>Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--green)' }}>Đăng ký</Link></p>
      </div>
    </section>
  );
}
