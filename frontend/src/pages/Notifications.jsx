import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui.jsx";
import { useAppContext } from "../context.js";
import { ICON_BY_TYPE, timeAgo, isChatLink } from "../utils/notif.js";

const PER_PAGE = 6;

export function Notifications() {
  const { notifs, fetchNotifs, markNotifRead, markAllNotifsRead, openChat } = useAppContext();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchNotifs();
  }, [fetchNotifs]);

  const unread = notifs.filter(n => !n.read).length;

  const totalPages = Math.max(1, Math.ceil(notifs.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = notifs.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const goPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClick = (n) => {
    if (!n.read) markNotifRead(n.id);
    // Thông báo chat: bật khung chat ngay tại chỗ, không rời trang.
    if (isChatLink(n.link)) { openChat(); return; }
    if (n.link) navigate(n.link);
  };

  return (
    <section className="section" style={{ minHeight: '80vh', padding: '40px 20px', background: 'var(--paper-2)' }}>
      <div className="wrap" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: "var(--green-ink)", display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="bell" size={24} /> Thông báo
            {unread > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, background: 'var(--green)', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>{unread} mới</span>
            )}
          </h2>
          {unread > 0 && (
            <button className="btn-pill ghost" style={{ fontSize: 13 }} onClick={markAllNotifsRead}>
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 12, border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Bạn chưa có thông báo nào</p>
            <Link to="/shop" className="btn-pill">Khám phá cửa hàng</Link>
          </div>
        ) : (
          <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pageItems.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="notif-item"
                style={{
                  background: !n.read ? '#f4faf5' : '#fff',
                  borderColor: !n.read ? 'var(--green)' : 'var(--line)',
                  cursor: n.link ? 'pointer' : 'default',
                }}
              >
                <div className="notif-icon" style={{ background: !n.read ? 'var(--green)' : 'var(--mint)', color: !n.read ? '#fff' : 'var(--green-ink)' }}>
                  <Icon name={ICON_BY_TYPE[n.type] || "bell"} size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="notif-header">
                    <h3 style={{ fontSize: 16, margin: 0, color: 'var(--ink)' }}>{n.title}</h3>
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{n.message}</p>
                  {n.link && (
                    <span style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Xem chi tiết →</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
              <button
                className="btn-pill ghost"
                style={{ padding: '8px 14px', fontSize: 13, opacity: currentPage === 1 ? 0.5 : 1 }}
                disabled={currentPage === 1}
                onClick={() => goPage(currentPage - 1)}
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  style={{
                    minWidth: 38,
                    height: 38,
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: p === currentPage ? 'var(--green)' : 'var(--line)',
                    background: p === currentPage ? 'var(--green)' : '#fff',
                    color: p === currentPage ? '#fff' : 'var(--ink)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn-pill ghost"
                style={{ padding: '8px 14px', fontSize: 13, opacity: currentPage === totalPages ? 0.5 : 1 }}
                disabled={currentPage === totalPages}
                onClick={() => goPage(currentPage + 1)}
              >
                Sau →
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </section>
  );
}
