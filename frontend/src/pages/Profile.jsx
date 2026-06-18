import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context.js";
import { Icon } from "../components/ui.jsx";

export function Profile() {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <section className="section" style={{ minHeight: '70vh', padding: '40px 20px', background: 'var(--paper-2)' }}>
      <div className="wrap" style={{ maxWidth: 800 }}>
        
        <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
          
          {/* Sidebar */}
          <div style={{ width: 250, background: '#fff', borderRadius: 16, border: '1px solid var(--line)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30, borderBottom: '1px solid var(--line-2)', paddingBottom: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mint)', color: 'var(--green-ink)', display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <b style={{ fontSize: 16 }}>{user.name}</b>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Thành viên NAM QUAN</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/profile" style={{ padding: '10px 14px', background: 'var(--mint)', color: 'var(--green-ink)', borderRadius: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="user" size={18} /> Hồ sơ của tôi
              </Link>
              <Link to="/orders" style={{ padding: '10px 14px', color: 'var(--ink-2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, transition: '.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <Icon name="truck" size={18} /> Đơn hàng mua
              </Link>
              <button onClick={logout} style={{ padding: '10px 14px', color: 'var(--red, #e6457a)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, transition: '.2s', textAlign: 'left', marginTop: 10, borderTop: '1px solid var(--line-2)', borderRadius: 0 }}>
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Main Info */}
          <div style={{ flex: 1, background: '#fff', padding: 30, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: 20, margin: '0 0 24px', color: 'var(--ink)' }}>Hồ Sơ Của Tôi</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 30 }}>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>

            <div style={{ display: 'grid', gap: 20, maxWidth: 400 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Tên đăng nhập</label>
                <div style={{ padding: '10px 14px', background: '#f5f5f5', borderRadius: 8, fontSize: 15 }}>{user.name}</div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Email</label>
                <div style={{ padding: '10px 14px', background: '#f5f5f5', borderRadius: 8, fontSize: 15 }}>{user.email}</div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Ngày tham gia</label>
                <div style={{ padding: '10px 14px', background: '#f5f5f5', borderRadius: 8, fontSize: 15 }}>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
