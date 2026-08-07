import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui.jsx";
import { useAppContext } from "../context.js";
import { ICON_BY_TYPE, timeAgo, isChatLink } from "../utils/notif.js";
import { AccountHeader } from "../components/AccountLayout.jsx";

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
    <>
      <AccountHeader
        title="Thông báo"
        desc={unread > 0 ? `Bạn có ${unread} thông báo chưa đọc` : "Cập nhật mới nhất từ NAM QUAN"}
        action={unread > 0 && (
          <button className="btn-pill ghost" style={{ fontSize: 13 }} onClick={markAllNotifsRead}>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      />

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
                <div className="notif-body">
                  <div className="notif-header">
                    <h3>{n.title}</h3>
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p>{n.message}</p>
                  {n.link && <span className="notif-more">Xem chi tiết →</span>}
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
    </>
  );
}
