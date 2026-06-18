import { Link } from "react-router-dom";
import { Icon } from "../components/ui.jsx";

export function Notifications() {
  const notifs = [
    { id: 1, title: "Đơn hàng đang giao!", desc: "Đơn hàng #A12B3 của bạn đang trên đường vận chuyển. Dự kiến nhận trong hôm nay.", date: "2 giờ trước", isNew: true, icon: "truck" },
    { id: 2, title: "Săn Flash Sale 50%", desc: "Duy nhất hôm nay! Mua ngay các mẫu Sofa cao cấp với giá ưu đãi cực khủng.", date: "1 ngày trước", isNew: true, icon: "star" },
    { id: 3, title: "Chào mừng bạn mới", desc: "Cảm ơn bạn đã đăng ký tài khoản NAM QUAN. Tặng bạn mã giảm giá 10% cho đơn đầu tiên.", date: "3 ngày trước", isNew: false, icon: "user" },
  ];

  return (
    <section className="section" style={{ minHeight: '80vh', padding: '40px 20px', background: 'var(--paper-2)' }}>
      <div className="wrap" style={{ maxWidth: 800 }}>
        <h2 style={{ marginBottom: 24, fontSize: 24, color: "var(--green-ink)", display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="bell" size={24} /> Thông báo
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notifs.map(n => (
            <div 
              key={n.id} 
              style={{ 
                background: n.isNew ? '#f4faf5' : '#fff', 
                border: '1px solid',
                borderColor: n.isNew ? 'var(--green)' : 'var(--line)',
                padding: 24, 
                borderRadius: 16, 
                display: 'flex', 
                gap: 20, 
                alignItems: 'flex-start',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: n.isNew ? 'var(--green)' : 'var(--mint)', color: n.isNew ? '#fff' : 'var(--green-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={n.icon} size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, margin: 0, color: 'var(--ink)' }}>{n.title}</h3>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{n.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{n.desc}</p>
                {n.id === 2 && (
                  <Link to="/shop" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Xem ngay →</Link>
                )}
                {n.id === 1 && (
                  <Link to="/orders" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Theo dõi đơn hàng →</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
