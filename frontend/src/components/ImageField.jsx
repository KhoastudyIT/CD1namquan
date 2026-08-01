import { useState, useRef, useEffect } from "react";
import { api, validateImageFile } from "../api.js";
import { Img, Icon, toast } from "./ui.jsx";

/**
 * Xem ảnh phóng to. z-index 9000: trên modal admin (1000) nhưng dưới toast (10000).
 */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // Khoá cuộn nền để không trôi trang phía sau khi đang xem ảnh
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(20, 30, 22, 0.82)", backdropFilter: "blur(3px)",
        display: "grid", placeItems: "center", padding: 32,
        cursor: "zoom-out",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        style={{
          position: "absolute", top: 20, right: 24,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,.92)", color: "var(--ink)",
          border: "none", cursor: "pointer", display: "grid", placeItems: "center",
        }}
      >
        <Icon name="close" size={16} />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "min(1100px, 92vw)", maxHeight: "88vh",
          objectFit: "contain", borderRadius: 10,
          boxShadow: "0 18px 60px rgba(0,0,0,.45)",
          cursor: "default",
        }}
      />

      <div style={{
        position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)",
        color: "rgba(255,255,255,.75)", fontSize: 12.5,
      }}>
        Bấm ra ngoài hoặc nhấn Esc để đóng
      </div>
    </div>
  );
}

/**
 * Ô chọn ảnh dùng chung cho các form trong dashboard.
 *
 * Tải file từ máy lên MinIO (URL có chữ ký, file không qua backend) và vẫn giữ
 * ô dán đường dẫn thủ công — dữ liệu seed đang dùng đường dẫn tĩnh dạng
 * `/images/news1.jpg` nên không thể bỏ cách nhập tay.
 *
 * @param {object} props
 * @param {string} props.value URL ảnh hiện tại
 * @param {(url: string) => void} props.onChange
 * @param {'news'|'products'|'categories'|'collections'} props.type Thư mục lưu trên MinIO
 * @param {(uploading: boolean) => void} [props.onUploadingChange] Để form khoá nút lưu khi đang tải
 * @param {string} [props.hint] Ghi chú thay cho dòng mặc định về định dạng/dung lượng
 */
export function ImageField({
  value,
  onChange,
  type,
  label = "Ảnh",
  required = false,
  onUploadingChange,
  hint,
}) {
  const [uploading, setUploading] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const inputRef = useRef(null);

  const setBusy = (busy) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // Reset ngay để chọn lại đúng file vừa rồi vẫn kích hoạt onChange
    e.target.value = "";
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) { toast(invalid); return; }

    setBusy(true);
    try {
      onChange(await api.uploadImage(file, type));
      toast("Đã tải ảnh lên!");
    } catch (err) {
      toast("Lỗi tải ảnh: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-form-group">
      <label>{label}{required && " *"}</label>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Bấm vào ảnh để xem phóng to — ảnh trong ô nhỏ khó kiểm tra chi tiết */}
        <div
          onClick={() => value && setZoomed(true)}
          title={value ? "Bấm để phóng to" : undefined}
          style={{
            width: 240, height: 160, flexShrink: 0,
            borderRadius: 9, overflow: "hidden", position: "relative",
            border: "1px solid var(--line)", background: "var(--paper-2)",
            display: "grid", placeItems: "center",
            cursor: value ? "zoom-in" : "default",
          }}
        >
          {value ? (
            <>
              <Img src={value} alt="Xem trước" label="ảnh lỗi" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{
                position: "absolute", right: 8, bottom: 8,
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(20,30,22,.62)", color: "#fff",
                padding: "4px 10px", borderRadius: 999,
                fontSize: 11, fontWeight: 600, pointerEvents: "none",
              }}>
                <Icon name="search" size={11} stroke={2} /> Phóng to
              </span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Chưa có ảnh</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 9 }}>
            <button
              type="button"
              className="btn-pill"
              style={{ padding: "8px 16px", fontSize: 13 }}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Đang tải lên..." : "📁 Chọn ảnh từ máy"}
            </button>
            {value && !uploading && (
              <button type="button" className="admin-btn-sm delete" onClick={() => onChange("")}>
                Bỏ ảnh
              </button>
            )}
          </div>
          <input
            type="text"
            className="admin-input"
            required={required}
            placeholder="hoặc dán đường dẫn ảnh"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
          <small style={{ fontSize: 11.5, color: "var(--muted)" }}>
            {hint || "JPG, PNG hoặc WEBP · tối đa 5MB"}
          </small>
        </div>
      </div>

      {zoomed && value && (
        <ImageLightbox src={value} alt={label} onClose={() => setZoomed(false)} />
      )}
    </div>
  );
}
