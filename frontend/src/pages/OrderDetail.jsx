import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { vnd, Img, toast } from "../components/ui.jsx";

export function OrderDetail() {
  const { id } = useParams();
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    api.getOrderById(id)
      .then(data => {
        if (data) setOrder(data);
      })
      .catch(err => {
        toast(err.message || "Không tìm thấy đơn hàng");
        navigate("/account/orders");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (!user) return null;

  if (loading) {
    return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><div style={{ color: "var(--muted)" }}>Đang tải...</div></div>;
  }

  if (!order) return null;

  return (
    <>
      <Link to="/account/orders" style={{ display: 'inline-block', marginBottom: 20, fontSize: 14, color: "var(--muted)" }}>← Trở lại danh sách đơn hàng</Link>

        <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--line-2)', paddingBottom: 20, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, margin: '0 0 8px', color: 'var(--ink)' }}>Chi tiết đơn hàng #{order.id.split('-')[0].toUpperCase()}</h2>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
            </div>
            <span style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, background: order.status === 'pending' ? '#fff3cd' : 'var(--mint)', color: order.status === 'pending' ? '#856404' : 'var(--green-ink)', fontWeight: 600 }}>
              {order.status === 'pending' ? 'Chờ xác nhận' : 'Hoàn thành'}
            </span>
          </div>

          <div className="order-detail-info">
            <div>
              <h3 style={{ fontSize: 15, margin: '0 0 10px', color: 'var(--ink-2)' }}>Thông tin giao hàng</h3>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                <b>{user.name}</b><br/>
                {order.shippingAddress}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, margin: '0 0 10px', color: 'var(--ink-2)' }}>Ghi chú</h3>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, background: '#f9f9f9', padding: 10, borderRadius: 8 }}>
                {order.note || "Không có ghi chú"}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, margin: '0 0 16px', borderBottom: '1px solid var(--line-2)', paddingBottom: 10 }}>Sản phẩm ({order.items.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <Img src={item.img} alt={item.name} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Link to={`/product/${item.productId}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{item.name}</Link>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    {item.quantity} x {vnd(item.price)}đ
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--green)', alignSelf: 'center' }}>
                  {vnd(item.price * item.quantity)}đ
                </div>
              </div>
            ))}
          </div>

          <div className="order-detail-summary">
            <div className="order-detail-summary-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Tạm tính</span>
                <span>{vnd(order.total)}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--line-2)', paddingTop: 15 }}>
                <b style={{ fontSize: 16 }}>Tổng thanh toán</b>
                <b style={{ fontSize: 20, color: 'var(--green-ink)' }}>{vnd(order.total)}đ</b>
              </div>
            </div>
          </div>

        </div>
    </>
  );
}
