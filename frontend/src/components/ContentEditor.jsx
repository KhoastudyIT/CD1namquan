import { useState, useRef, useEffect } from "react";
import { api, validateImageFile } from "../api.js";
import { toast } from "./ui.jsx";
import { ArticleContent } from "./ArticleContent.jsx";

/**
 * Trình soạn nội dung bài viết: thanh công cụ chèn cú pháp vào textarea, kèm
 * khung xem trước dùng chính bộ render của trang công khai.
 *
 * Cố ý KHÔNG dùng WYSIWYG: nội dung vẫn là văn bản thuần nên không có bề mặt
 * XSS và không cần thêm dependency nào.
 */
export function ContentEditor({ value, onChange, imageType = "news", height = 300 }) {
  const taRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Vị trí con trỏ cần khôi phục sau khi React render lại giá trị mới
  const pendingSelection = useRef(null);

  useEffect(() => {
    if (!pendingSelection.current || !taRef.current) return;
    const [start, end] = pendingSelection.current;
    pendingSelection.current = null;
    taRef.current.focus();
    taRef.current.setSelectionRange(start, end);
  }, [value]);

  // Thay đoạn [from, to) bằng text mới rồi đặt lại con trỏ
  const splice = (from, to, text, selStart, selEnd) => {
    const next = value.slice(0, from) + text + value.slice(to);
    pendingSelection.current = [selStart, selEnd ?? selStart];
    onChange(next);
  };

  const getSel = () => {
    const ta = taRef.current;
    if (!ta) return { start: value.length, end: value.length };
    return { start: ta.selectionStart, end: ta.selectionEnd };
  };

  /** Bọc vùng chọn: **đậm**, *nghiêng* */
  const wrap = (marker, placeholder) => {
    const { start, end } = getSel();
    const selected = value.slice(start, end) || placeholder;
    const text = `${marker}${selected}${marker}`;
    splice(start, end, text, start + marker.length, start + marker.length + selected.length);
  };

  /** Thêm tiền tố vào đầu mỗi dòng đang chọn: "## ", "- ", "> "… Bấm lại để bỏ. */
  const prefixLines = (prefix, { numbered = false } = {}) => {
    const { start, end } = getSel();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = value.indexOf("\n", end);
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;

    const chunk = value.slice(lineStart, lineEnd) || "";
    const lines = chunk.split("\n");
    const re = numbered ? /^\d+\.\s+/ : new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    const allPrefixed = lines.every(l => re.test(l));

    const next = lines.map((l, i) => {
      if (allPrefixed) return l.replace(re, "");
      const clean = l.replace(/^(#{2,3}\s+|-\s+|>\s?|\d+\.\s+)/, "");
      return numbered ? `${i + 1}. ${clean}` : `${prefix}${clean}`;
    }).join("\n");

    splice(lineStart, lineEnd, next, lineStart, lineStart + next.length);
  };

  /** Chèn một khối riêng, tự thêm dòng trống ngăn cách nếu cần */
  const insertBlock = (text) => {
    const { start, end } = getSel();
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lead = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const tail = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
    const payload = `${lead}${text}${tail}`;
    splice(start, end, payload, start + lead.length + text.length);
  };

  const addLink = () => {
    const { start, end } = getSel();
    const selected = value.slice(start, end);
    const url = window.prompt("Đường dẫn (https://... hoặc /duong-dan)", "https://");
    if (!url) return;
    const label = selected || window.prompt("Chữ hiển thị", "xem thêm") || url;
    const text = `[${label}](${url.trim()})`;
    splice(start, end, text, start + text.length);
  };

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const invalid = validateImageFile(file);
      if (invalid) { toast(invalid); return; }

      setUploading(true);
      try {
        const url = await api.uploadImage(file, imageType);
        const caption = window.prompt("Chú thích ảnh (để trống nếu không cần)", "") || "";
        insertBlock(`![${caption}](${url})`);
        toast("Đã chèn ảnh vào bài viết!");
      } catch (err) {
        toast("Lỗi tải ảnh: " + err.message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const Btn = ({ onClick, title, children, wide }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={uploading}
      style={{
        minWidth: wide ? "auto" : 32, height: 30, padding: wide ? "0 10px" : "0 6px",
        borderRadius: 7, border: "1px solid var(--line)", background: "#fff",
        color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: ".15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--mint)"; e.currentTarget.style.borderColor = "var(--green)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      {children}
    </button>
  );

  const Sep = () => <span style={{ width: 1, height: 20, background: "var(--line)", margin: "0 3px" }} />;

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
      {/* Thanh công cụ */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap",
        padding: "8px 10px", background: "var(--paper-2)", borderBottom: "1px solid var(--line)",
      }}>
        <Btn onClick={() => wrap("**", "chữ đậm")} title="Đậm"><b>B</b></Btn>
        <Btn onClick={() => wrap("*", "chữ nghiêng")} title="Nghiêng"><i>I</i></Btn>
        <Sep />
        <Btn onClick={() => prefixLines("## ")} title="Tiêu đề mục">H2</Btn>
        <Btn onClick={() => prefixLines("### ")} title="Tiêu đề phụ">H3</Btn>
        <Sep />
        <Btn onClick={() => prefixLines("- ")} title="Gạch đầu dòng">•</Btn>
        <Btn onClick={() => prefixLines("", { numbered: true })} title="Danh sách đánh số">1.</Btn>
        <Btn onClick={() => prefixLines("> ")} title="Trích dẫn">❝</Btn>
        <Sep />
        <Btn onClick={addLink} title="Chèn liên kết" wide>🔗 Link</Btn>
        <Btn onClick={pickImage} title="Tải ảnh từ máy và chèn vào bài" wide>
          {uploading ? "⏳ Đang tải..." : "🖼 Ảnh"}
        </Btn>

        <div style={{ marginLeft: "auto" }}>
          <Btn onClick={() => setPreview(p => !p)} title="Xem trước như trang công khai" wide>
            {preview ? "✎ Soạn thảo" : "👁 Xem trước"}
          </Btn>
        </div>
      </div>

      {/* Vùng soạn thảo / xem trước */}
      {preview ? (
        <div style={{
          height, overflowY: "auto", padding: "18px 20px",
          background: "#fff", fontSize: 15, color: "var(--ink-2)",
        }}>
          {value.trim()
            ? <ArticleContent content={value} compact />
            : <span style={{ color: "var(--muted)", fontSize: 13.5 }}>Chưa có nội dung để xem trước.</span>}
        </div>
      ) : (
        <textarea
          ref={taRef}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={"Đoạn mở đầu...\n\n## Tiêu đề mục\n\n- **Ý chính**: diễn giải"}
          style={{
            display: "block", width: "100%", height, padding: "14px 16px",
            border: "none", outline: "none", resize: "vertical",
            fontFamily: "ui-monospace, monospace", fontSize: 13, lineHeight: 1.7,
            color: "var(--ink)",
          }}
        />
      )}
    </div>
  );
}
