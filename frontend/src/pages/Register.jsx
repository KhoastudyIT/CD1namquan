import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { toast } from "../components/ui.jsx";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser, fetchCart, fetchNotifs } = useAppContext();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await api.register({ name, email, password });
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        fetchCart();
        fetchNotifs();
        toast("Đăng ký thành công!");
        navigate("/");
      }
    } catch (err) {
      toast(err.message || "Đăng ký thất bại");
    }
  };

  return (
    <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9faf9' }}>
      <div className="auth-box" style={{ maxWidth: 400, width: '100%', padding: 30, background: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Đăng ký</h2>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <input type="text" placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
          <button type="submit" className="btn-pill" style={{ width: '100%', justifyContent: 'center', background: 'var(--green)', color: '#fff', padding: 14 }}>Đăng ký</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 15, fontSize: 14 }}>Đã có tài khoản? <Link to="/login" style={{ color: 'var(--green)' }}>Đăng nhập</Link></p>
      </div>
    </section>
  );
}
