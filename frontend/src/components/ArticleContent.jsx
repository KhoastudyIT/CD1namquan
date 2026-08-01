import { Img } from "./ui.jsx";

/**
 * Bộ render nội dung bài viết — dùng chung cho trang công khai và khung xem
 * trước trong dashboard, nên những gì admin thấy đúng bằng cái độc giả thấy.
 *
 * Nội dung là văn bản thuần với cú pháp rút gọn (backend đã gỡ hết thẻ HTML).
 * Ở đây chỉ dựng React element — không dùng dangerouslySetInnerHTML.
 *
 *   ## / ###           tiêu đề mục
 *   -                  gạch đầu dòng
 *   1.                 danh sách đánh số
 *   >                  trích dẫn
 *   **đậm**  *nghiêng*
 *   [chữ](url)         liên kết
 *   ![mô tả](url)      ảnh
 */

// Chỉ cho phép http(s) và đường dẫn nội bộ. Chặn javascript:, data:, vbscript:
// — kể cả khi có ai đó ghi thẳng vào DB.
function safeUrl(url) {
  const u = String(url).trim();
  return /^(https?:\/\/|\/)/i.test(u) ? u : null;
}

// Bắt cả 4 dạng inline trong một lượt để không phải quét chồng nhiều lần.
const INLINE_RE = /(!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;

function renderInline(text, keyPrefix) {
  return text.split(INLINE_RE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key} style={{ color: "var(--green-ink)" }}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    // Ảnh nằm giữa dòng chữ
    const img = part.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (img) {
      const src = safeUrl(img[2]);
      if (!src) return <span key={key}>{part}</span>;
      return (
        <img
          key={key}
          src={src}
          alt={img[1]}
          style={{ maxWidth: "100%", borderRadius: 8, verticalAlign: "middle" }}
        />
      );
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const href = safeUrl(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          style={{ color: "var(--green)", fontWeight: 600, textDecoration: "underline" }}
        >
          {link[1]}
        </a>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

const NUMBERED_RE = /^\d+\.\s+/;

export function ArticleContent({ content, compact = false }) {
  if (!content?.trim()) return null;

  // Chuẩn hoá CRLF/CR về LF trước khi tách đoạn. Nội dung có thể tới từ file SQL
  // seed ghi trên Windows hoặc do admin dán từ Word — nếu không chuẩn hoá thì
  // regex tách đoạn không khớp và cả bài dồn thành một khối văn bản thô.
  const normalized = content.replace(/\r\n?/g, "\n");

  const gap    = compact ? 14 : 20;
  const headMt = compact ? 22 : 34;

  const blocks = [];

  normalized.split(/\n{2,}/).forEach((raw, blockIndex) => {
    const block = raw.trim();
    if (!block) return;

    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const key = `b${blockIndex}`;

    // Ảnh đứng riêng một khối
    const loneImage = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (loneImage) {
      const src = safeUrl(loneImage[2]);
      if (src) {
        blocks.push(
          <figure key={key} style={{ margin: `${gap}px 0 ${gap + 6}px` }}>
            <Img
              src={src}
              alt={loneImage[1]}
              label="ảnh trong bài viết"
              style={{ width: "100%", height: "auto", borderRadius: 10, display: "block" }}
            />
            {loneImage[1] && (
              <figcaption style={{
                marginTop: 8, fontSize: 12.5, color: "var(--muted)",
                textAlign: "center", fontStyle: "italic",
              }}>
                {loneImage[1]}
              </figcaption>
            )}
          </figure>
        );
        return;
      }
    }

    // Trích dẫn
    if (lines.every(l => l.startsWith(">"))) {
      const text = lines.map(l => l.replace(/^>\s?/, "")).join(" ");
      blocks.push(
        <blockquote key={key} style={{
          margin: `${gap}px 0`, padding: "12px 0 12px 20px",
          borderLeft: "3px solid var(--green)",
          color: "var(--green-ink)", fontStyle: "italic", lineHeight: 1.75,
        }}>
          {renderInline(text, key)}
        </blockquote>
      );
      return;
    }

    // Danh sách gạch đầu dòng
    if (lines.every(l => l.startsWith("- "))) {
      blocks.push(
        <ul key={key} style={{ margin: `0 0 ${gap + 2}px`, paddingLeft: 22, display: "grid", gap: 10 }}>
          {lines.map((l, i) => (
            <li key={i} style={{ lineHeight: 1.8 }}>{renderInline(l.slice(2), `${key}-${i}`)}</li>
          ))}
        </ul>
      );
      return;
    }

    // Danh sách đánh số
    if (lines.length > 0 && lines.every(l => NUMBERED_RE.test(l))) {
      blocks.push(
        <ol key={key} style={{ margin: `0 0 ${gap + 2}px`, paddingLeft: 24, display: "grid", gap: 10 }}>
          {lines.map((l, i) => (
            <li key={i} style={{ lineHeight: 1.8 }}>{renderInline(l.replace(NUMBERED_RE, ""), `${key}-${i}`)}</li>
          ))}
        </ol>
      );
      return;
    }

    if (block.startsWith("### ")) {
      blocks.push(
        <h3 key={key} style={{
          fontSize: compact ? 16 : 18, fontWeight: 800, color: "var(--green-ink)",
          margin: `${headMt - 8}px 0 10px`, lineHeight: 1.4,
        }}>
          {block.slice(4)}
        </h3>
      );
      return;
    }

    if (block.startsWith("## ")) {
      blocks.push(
        <h2 key={key} style={{
          fontSize: compact ? 18 : 21, fontWeight: 800, color: "var(--green-ink)",
          margin: `${headMt}px 0 14px`, lineHeight: 1.35, fontFamily: "var(--serif)",
        }}>
          {block.slice(3)}
        </h2>
      );
      return;
    }

    blocks.push(
      <p key={key} style={{ margin: `0 0 ${gap}px`, lineHeight: 1.85 }}>
        {renderInline(block, key)}
      </p>
    );
  });

  return <>{blocks}</>;
}
