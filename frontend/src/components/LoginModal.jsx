import { useNavigate } from "react-router-dom";
import { Icon } from "./ui.jsx";

/**
 * Popup shown when a guest tries to use a feature that needs an account.
 * `prompt` = { message, redirectTo } or null when closed.
 */
export function LoginModal({ prompt, onClose }) {
  const navigate = useNavigate();
  if (!prompt) return null;

  const goLogin = () => {
    onClose();
    navigate("/login", { state: { from: prompt.redirectTo } });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-panel"
        style={{ maxWidth: 380, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="admin-modal-close" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>

        <div
          style={{
            width: 64, height: 64, borderRadius: "50%", background: "var(--mint)",
            color: "var(--green-ink)", display: "grid", placeItems: "center",
            margin: "8px auto 16px",
          }}
        >
          <Icon name="user" size={28} />
        </div>

        <h3 style={{ margin: "0 0 10px", fontSize: 19, color: "var(--green-ink)" }}>
          Cần đăng nhập
        </h3>
        <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
          {prompt.message || "Vui lòng đăng nhập để tiếp tục sử dụng tính năng này."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn-pill"
            style={{ justifyContent: "center", background: "var(--green)", color: "#fff", padding: 13 }}
            onClick={goLogin}
          >
            Đăng nhập ngay
          </button>
          <button
            className="btn-pill ghost"
            style={{ justifyContent: "center" }}
            onClick={onClose}
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
