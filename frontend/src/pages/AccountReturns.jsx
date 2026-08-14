import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { vnd, Icon, toast } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";
import { RETURN_STATUS_META, RETURN_TYPE_LABEL } from "../components/ReturnRequest.jsx";

/**
 * Lịch sử yêu cầu trả / đổi hàng của khách.
 *
 * Trang chi tiết đơn chỉ hiện yêu cầu của riêng đơn đó, nên khách cần một chỗ
 * xem lại toàn bộ — nhất là để đọc phản hồi của cửa hàng sau khi được duyệt
 * hoặc bị từ chối.
 */
export function AccountReturns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyReturns()
      .then(list => setItems(list ?? []))
      .catch(err => toast(err.message || "Không tải được lịch sử trả hàng"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <AccountHeader title="Trả / đổi hàng" />
        <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Đang tải...</div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <AccountHeader title="Trả / đổi hàng" />
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <Icon name="refresh" size={34} style={{ color: "var(--muted-2)" }} />
          <h3 style={{ margin: "12px 0 6px", fontSize: 16, color: "var(--ink)" }}>Chưa có yêu cầu nào</h3>
          <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>
            Sản phẩm có lỗi hoặc không đúng mô tả? Bạn gửi yêu cầu trả / đổi ngay trong
            trang chi tiết đơn hàng đã nhận.
          </p>
          <Link to="/account/orders" className="btn-pill">Xem đơn hàng của tôi</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AccountHeader title="Trả / đổi hàng" desc={`${items.length} yêu cầu đã gửi`} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map(r => {
          const meta = RETURN_STATUS_META[r.status] ?? RETURN_STATUS_META.pending;
          return (
            <div key={r.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{
                  display: "inline-block", padding: "3px 11px", borderRadius: 999,
                  fontSize: 12, fontWeight: 700,
                  background: r.type === "return" ? "#fee2e2" : "#ede9fe",
                  color: r.type === "return" ? "#b91c1c" : "#5b21b6",
                }}>
                  {RETURN_TYPE_LABEL[r.type]}
                </span>
                <span style={{ ...pill, background: meta.bg, color: meta.color }}>{meta.label}</span>
                <Link to={`/account/orders/${r.orderId}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--green-ink)" }}>
                  Đơn #{String(r.orderId).split("-")[0].toUpperCase()}
                </Link>
                <span style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: "auto" }}>
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>

              <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65 }}>{r.reason}</div>

              {r.imageUrls?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {r.imageUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" style={thumb}>
                      <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </a>
                  ))}
                </div>
              )}

              {r.adminNote && (
                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 10,
                  background: r.status === "rejected" ? "#fef6f6" : "#f9fbf9",
                  border: `1px solid ${r.status === "rejected" ? "#f3c9c9" : "var(--line)"}`,
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginBottom: 4,
                    color: r.status === "rejected" ? "#b91c1c" : "var(--muted)",
                  }}>
                    {r.status === "rejected" ? "Lý do từ chối" : "Phản hồi từ Nam Quan"}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>{r.adminNote}</div>
                </div>
              )}

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--line-2)", display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
                <span>Giá trị đơn: <b style={{ color: "var(--ink-2)" }}>{vnd(r.orderTotal)}đ</b></span>
                {r.resolvedAt && <span>Xử lý xong: {new Date(r.resolvedAt).toLocaleDateString("vi-VN")}</span>}
                {r.status === "completed" && r.type === "return" && (
                  <span style={{ color: "var(--green-ink)", fontWeight: 600 }}>Đã hoàn tiền</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const card = {
  background: "#fff", border: "1px solid var(--line)", borderRadius: 16,
  padding: 20, boxShadow: "var(--shadow-sm)",
};
const pill = { display: "inline-block", padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
const thumb = {
  width: 74, height: 74, borderRadius: 10, overflow: "hidden",
  border: "1px solid var(--line-2)", flexShrink: 0,
};
