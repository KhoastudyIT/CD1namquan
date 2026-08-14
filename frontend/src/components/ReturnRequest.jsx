import { useState, useRef } from "react";
import { api } from "../api.js";
import { Icon, toast } from "./ui.jsx";

/** Khớp với backend: order_returns.status và return.schema.js */
export const RETURN_STATUS_META = {
  pending:   { label: "Chờ duyệt", bg: "#fef3c7", color: "#92400e" },
  approved:  { label: "Đã duyệt",  bg: "#dbeafe", color: "#1e40af" },
  rejected:  { label: "Từ chối",   bg: "#fee2e2", color: "#b91c1c" },
  completed: { label: "Hoàn tất",  bg: "#dcfce7", color: "var(--green-ink)" },
};

export const RETURN_TYPE_LABEL = { return: "Trả hàng", exchange: "Đổi hàng" };

const MIN_IMAGES = 2;
const MAX_IMAGES = 5;
/** Đồng bộ với RETURN_WINDOW_DAYS ở backend/src/modules/returns/return.service.js */
export const RETURN_WINDOW_DAYS = 7;

/**
 * Khối "Trả / đổi hàng" trong trang chi tiết đơn.
 *
 * Hiện yêu cầu đang có (nếu đã gửi), hoặc form gửi yêu cầu mới khi đơn còn đủ
 * điều kiện. Điều kiện thật do server quyết định — ở đây chỉ ẩn bớt cho gọn.
 */
export function ReturnRequest({ order, existing, onCreated }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("return");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState([]);      // objectKey[]
  const [previews, setPreviews] = useState([]);  // blob URL để xem trước
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const delivered = order.status === "delivered";
  const daysSince = (Date.now() - new Date(order.updatedAt ?? order.createdAt).getTime()) / 86_400_000;
  const expired = daysSince > RETURN_WINDOW_DAYS;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast(`Chỉ đính kèm tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    setUploading(true);
    try {
      for (const file of files) {
        const key = await api.uploadReturnImage(file);
        setImages(prev => [...prev, key]);
        setPreviews(prev => [...prev, URL.createObjectURL(file)]);
      }
    } catch (err) {
      toast("Tải ảnh thất bại: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 10) return toast("Vui lòng mô tả lý do ít nhất 10 ký tự");
    if (images.length < MIN_IMAGES) return toast(`Vui lòng đính kèm ít nhất ${MIN_IMAGES} ảnh sản phẩm`);

    setSaving(true);
    try {
      const created = await api.createReturn({ orderId: order.id, type, reason: reason.trim(), images });
      toast("Đã gửi yêu cầu, Nam Quan sẽ phản hồi sớm nhất.");
      setOpen(false);
      setReason(""); setImages([]); setPreviews([]);
      onCreated?.(created);
    } catch (err) {
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Đã có yêu cầu đang mở hoặc đã xử lý ────────────────────────────────────
  if (existing) {
    const meta = RETURN_STATUS_META[existing.status] ?? RETURN_STATUS_META.pending;
    const canResend = existing.status === "rejected";
    return (
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={heading}>Yêu cầu {RETURN_TYPE_LABEL[existing.type]?.toLowerCase()}</h3>
          <span style={{ ...pill, background: meta.bg, color: meta.color }}>{meta.label}</span>
          <span style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: "auto" }}>
            Gửi ngày {new Date(existing.createdAt).toLocaleDateString("vi-VN")}
          </span>
        </div>

        <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65 }}>{existing.reason}</div>

        {existing.imageUrls?.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {existing.imageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" style={thumb}>
                <img src={url} alt={`Ảnh ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </a>
            ))}
          </div>
        )}

        {existing.adminNote && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 10,
            background: existing.status === "rejected" ? "#fef6f6" : "#f9fbf9",
            border: `1px solid ${existing.status === "rejected" ? "#f3c9c9" : "var(--line)"}`,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, marginBottom: 4,
              color: existing.status === "rejected" ? "#b91c1c" : "var(--muted)",
            }}>
              {existing.status === "rejected" ? "Lý do từ chối" : "Phản hồi từ Nam Quan"}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>{existing.adminNote}</div>
          </div>
        )}

        {canResend && !open && (
          <button type="button" style={btnGhost} onClick={() => setOpen(true)}>
            Gửi yêu cầu khác
          </button>
        )}
        {canResend && open && renderForm()}
      </div>
    );
  }

  // ── Chưa có yêu cầu nào ────────────────────────────────────────────────────
  if (!delivered) return null;

  if (expired) {
    return (
      <div style={box}>
        <h3 style={heading}>Trả / đổi hàng</h3>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>
          Đã quá {RETURN_WINDOW_DAYS} ngày kể từ khi đơn được giao nên không yêu cầu trả/đổi được nữa.
          Cần hỗ trợ thêm, bạn vui lòng liên hệ Nam Quan qua khung chat.
        </p>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 style={heading}>Trả / đổi hàng</h3>
        {!open && (
          <button type="button" style={{ ...btnGhost, marginTop: 0, marginLeft: "auto" }} onClick={() => setOpen(true)}>
            Gửi yêu cầu
          </button>
        )}
      </div>
      {!open && (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>
          Sản phẩm có lỗi hoặc không đúng mô tả? Bạn được yêu cầu trả hoặc đổi
          trong vòng {RETURN_WINDOW_DAYS} ngày kể từ khi nhận hàng.
        </p>
      )}
      {open && renderForm()}
    </div>
  );

  function renderForm() {
    return (
      <form onSubmit={submit} style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {Object.entries(RETURN_TYPE_LABEL).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              style={{
                ...pill, cursor: "pointer", padding: "8px 18px", fontSize: 13,
                border: `1.5px solid ${type === value ? "var(--green)" : "var(--line)"}`,
                background: type === value ? "var(--mint)" : "#fff",
                color: type === value ? "var(--green-ink)" : "var(--muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <label style={label}>Lý do <span style={{ color: "#b91c1c" }}>*</span></label>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
          placeholder="Mô tả tình trạng sản phẩm, ví dụ: mặt bàn bị xước dài ở góc phải, chân ghế lỏng..."
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14,
            border: "1px solid var(--line-2)", fontFamily: "inherit", resize: "vertical",
          }}
        />
        <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 14px" }}>
          {reason.trim().length}/500 — tối thiểu 10 ký tự
        </div>

        <label style={label}>
          Ảnh sản phẩm <span style={{ color: "#b91c1c" }}>*</span>
          <span style={{ fontWeight: 400, color: "var(--muted)" }}> — từ {MIN_IMAGES} đến {MAX_IMAGES} tấm</span>
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          {previews.map((src, i) => (
            <div key={i} style={{ ...thumb, position: "relative" }}>
              <img src={src} alt={`Ảnh ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => removeImage(i)}
                title="Bỏ ảnh này"
                style={{
                  position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%",
                  border: "none", background: "rgba(0,0,0,.55)", color: "#fff", cursor: "pointer",
                  display: "grid", placeItems: "center", fontSize: 11, lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ ...thumb, display: "grid", placeItems: "center", cursor: "pointer", background: "#fbfdfb", color: "var(--muted)" }}
            >
              {uploading ? "..." : <Icon name="plus" size={18} />}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          Nên có một ảnh toàn cảnh và một ảnh cận chỗ lỗi để Nam Quan xử lý nhanh hơn.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn-pill ghost" onClick={() => setOpen(false)}>Huỷ</button>
          <button type="submit" className="btn-pill" disabled={saving || uploading}>
            {saving ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    );
  }
}

const box = {
  background: "#fff", padding: 24, borderRadius: 16, marginTop: 20,
  boxShadow: "var(--shadow-sm)", border: "1px solid var(--line)",
};
const heading = { fontSize: 16, margin: 0, color: "var(--ink)" };
const label = { display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 };
const pill = { display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
const thumb = {
  width: 74, height: 74, borderRadius: 10, overflow: "hidden",
  border: "1px solid var(--line-2)", flexShrink: 0, padding: 0,
};
const btnGhost = {
  marginTop: 14, padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700,
  border: "1.5px solid var(--green)", background: "#fff", color: "var(--green-ink)", cursor: "pointer",
};
