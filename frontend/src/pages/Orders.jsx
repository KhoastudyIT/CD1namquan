import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { vnd, Icon, toast } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";

export function Orders() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    api.getOrders()
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(err => toast(err.message || "Lỗi tải lịch sử đơn hàng"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (!user) return null;

  return (
    <>
      <AccountHeader title="Lịch sử đơn hàng" desc="Theo dõi tình trạng các đơn bạn đã đặt" />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'var(--muted)' }}>Đang tải...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 12, border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Bạn chưa có đơn hàng nào</p>
            <Link to="/shop" className="btn-pill">Khám phá cửa hàng</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(o => (
              <Link 
                to={`/account/orders/${o.id}`}
                key={o.id}
                className="order-card"
                style={{
                  background: '#fff', padding: 20, borderRadius: 12,
                  border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
                  transition: '.2s'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--green)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div className="order-card-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <b style={{ color: 'var(--ink)' }}>#{o.id.split('-')[0].toUpperCase()}</b>
                    <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: o.status === 'pending' ? '#fff3cd' : 'var(--mint)', color: o.status === 'pending' ? '#856404' : 'var(--green-ink)', fontWeight: 600 }}>
                      {o.status === 'pending' ? 'Chờ xác nhận' : 'Hoàn thành'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Đặt ngày: {new Date(o.createdAt).toLocaleDateString('vi-VN')} • {o.items?.length ?? 0} sản phẩm
                  </div>
                </div>
                <div className="order-card-right">
                  <b style={{ color: 'var(--green-ink)', fontSize: 16 }}>{vnd(o.total)}đ</b>
                  <Icon name="arrowR" size={18} style={{ color: 'var(--muted)' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
    </>
  );
}
