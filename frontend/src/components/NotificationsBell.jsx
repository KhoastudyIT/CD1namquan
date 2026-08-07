import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "./ui.jsx";
import { useAppContext } from "../context.js";
import { ICON_BY_TYPE, timeAgo, isChatLink } from "../utils/notif.js";

export function NotificationsBell() {
  const { user, notifs, fetchNotifs, markNotifRead, markAllNotifsRead, requireLogin, openChat } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside the bell/dropdown.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = notifs.filter((n) => !n.read).length;
  const recent = notifs.slice(0, 5);

  const handleBell = () => {
    if (!requireLogin("Vui lòng đăng nhập để xem thông báo của bạn.", "/account/notifications")) return;
    if (!open) fetchNotifs();
    setOpen((o) => !o);
  };

  const handleItem = (n) => {
    if (!n.read) markNotifRead(n.id);
    setOpen(false);
    // Thông báo chat: bật khung chat ngay tại trang đang đứng, không điều hướng.
    if (isChatLink(n.link)) { openChat(); return; }
    if (n.link) navigate(n.link);
  };

  const goAll = () => {
    setOpen(false);
    navigate("/account/notifications");
  };

  return (
    <div ref={ref} className="notif-bell">
      <button className="icon-btn" aria-label="Thông báo" onClick={handleBell}>
        <Icon name="bell" size={19} />
        {user && unread > 0 && <span className="badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-pop">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--green-ink)" }}>Thông báo</span>
            {unread > 0 && (
              <button
                onClick={markAllNotifsRead}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "var(--green)" }}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
              Chưa có thông báo nào
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {recent.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItem(n)}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--line)",
                    background: n.read ? "#fff" : "#f4faf5",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: n.read ? "var(--mint)" : "var(--green)",
                      color: n.read ? "var(--green-ink)" : "#fff",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name={ICON_BY_TYPE[n.type] || "bell"} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)", marginBottom: 2 }}>{n.title}</div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--ink-2)",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notifs.length > 5 && (
            <button
              onClick={goAll}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderTop: "1px solid var(--line)",
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--green)",
              }}
            >
              Xem tất cả ({notifs.length}) →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
