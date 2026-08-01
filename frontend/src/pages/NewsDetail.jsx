import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { Img, Icon, toast } from "../components/ui.jsx";
import { ArticleContent } from "../components/ArticleContent.jsx";

export function NewsDetail() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.getNewsById(idOrSlug)
      .then(data => {
        if (data) setArticle(data);
      })
      .catch(err => {
        toast(err.message || "Không tìm thấy bài viết");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [idOrSlug, navigate]);

  // Bài liên quan do backend chọn (ưu tiên cùng danh mục)
  useEffect(() => {
    api.getRelatedNews(idOrSlug, 3)
      .then(data => setRelated(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [idOrSlug]);

  // Thẻ tiêu đề/description/Open Graph cho SEO và khi chia sẻ liên kết.
  // Ảnh chia sẻ: dùng OG image nếu admin đặt riêng, không thì lấy ảnh bìa.
  useEffect(() => {
    if (!article) return;

    const seoTitle = article.seo?.title || article.title;
    const seoDesc  = article.seo?.description || article.excerpt;
    const shareImg = article.seo?.ogImage || article.img;
    // Ảnh chia sẻ phải là URL tuyệt đối — mạng xã hội không đọc được '/images/x.jpg'
    const absoluteImg = shareImg?.startsWith("http")
      ? shareImg
      : `${window.location.origin}${shareImg || ""}`;

    const previousTitle = document.title;
    document.title = `${seoTitle} | NAM QUAN`;

    // Tạo thẻ nếu chưa có, nhớ giá trị cũ để trả lại khi rời trang
    const managed = [];
    const setMeta = (selector, attrs, content) => {
      let tag = document.head.querySelector(selector);
      const existed = Boolean(tag);
      if (!tag) {
        tag = document.createElement("meta");
        Object.entries(attrs).forEach(([k, v]) => tag.setAttribute(k, v));
        document.head.appendChild(tag);
      }
      managed.push({ tag, existed, previous: tag.getAttribute("content") });
      tag.setAttribute("content", content);
    };

    setMeta('meta[name="description"]',      { name: "description" },      seoDesc);
    setMeta('meta[property="og:type"]',      { property: "og:type" },      "article");
    setMeta('meta[property="og:title"]',     { property: "og:title" },     seoTitle);
    setMeta('meta[property="og:description"]', { property: "og:description" }, seoDesc);
    setMeta('meta[property="og:image"]',     { property: "og:image" },     absoluteImg);
    setMeta('meta[property="og:url"]',       { property: "og:url" },       window.location.href);
    setMeta('meta[name="twitter:card"]',     { name: "twitter:card" },     "summary_large_image");

    return () => {
      document.title = previousTitle;
      managed.forEach(({ tag, existed, previous }) => {
        if (existed) tag.setAttribute("content", previous || "");
        else tag.remove();
      });
    };
  }, [article]);

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid var(--mint-3)", borderTopColor: "var(--green)",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: "var(--muted)", fontWeight: 500, fontSize: 15 }}>Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero với ảnh bìa */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "480px",
        overflow: "hidden",
        background: "var(--ink)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(20,30,22,0.1) 0%, rgba(20,30,22,0.75) 100%)",
          zIndex: 1,
        }} />
        <div style={{
          position: "absolute", inset: 0,
          overflow: "hidden",
        }}>
          <Img
            src={article.img}
            alt={article.title}
            label="ảnh bìa bài viết"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: "scale(1.04)", filter: "blur(1px)",
            }}
          />
        </div>

        {/* Breadcrumb + tiêu đề trên ảnh */}
        <div className="wrap" style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 48 }}>
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4, transition: ".2s" }}>
              <Icon name="leaf" size={14} stroke={2} />
              Trang chủ
            </Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <Link to="/news" style={{ color: "rgba(255,255,255,0.75)", transition: ".2s" }}>Tin tức</Link>
            {article.category && (
              <>
                <span style={{ opacity: 0.5 }}>/</span>
                <Link
                  to={`/news?category=${article.category.slug}`}
                  style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}
                >
                  {article.category.name}
                </Link>
              </>
            )}
          </nav>

          {/* Danh mục · ngày đăng · thời gian đọc */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {article.category && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                background: "var(--green)", color: "#fff",
                padding: "5px 14px", borderRadius: 999,
                fontSize: 12, fontWeight: 700, letterSpacing: ".04em",
              }}>
                {article.category.name}
              </span>
            )}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,.16)", color: "#fff",
              padding: "5px 14px", borderRadius: 999,
              fontSize: 12, fontWeight: 600,
              backdropFilter: "blur(4px)",
            }}>
              <Icon name="bell" size={12} stroke={2} />
              {article.date} · {article.readingTime} phút đọc
            </span>
          </div>

          {/* Tiêu đề */}
          <h1 style={{
            fontSize: "clamp(24px, 4vw, 38px)",
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            lineHeight: 1.25,
            maxWidth: 780,
            textShadow: "0 2px 12px rgba(0,0,0,0.3)",
            fontFamily: "var(--serif)",
          }}>
            {article.title}
          </h1>
        </div>
      </div>

      {/* Body */}
      <section style={{ background: "var(--paper-2)", padding: "0 0 80px" }}>
        <div className="wrap" style={{ maxWidth: 1120 }}>

          {/* Card nội dung chính — đặt hẳn dưới hero để không che ảnh bìa */}
          <div style={{
            background: "#fff",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            padding: "52px 64px",
            marginTop: 40,
            position: "relative",
            zIndex: 2,
          }}>
            {/* Excerpt — nổi bật */}
            <p style={{
              fontSize: 18,
              color: "var(--green-ink)",
              fontWeight: 600,
              lineHeight: 1.7,
              paddingBottom: 28,
              borderBottom: "2px solid var(--mint-2)",
              marginBottom: 32,
              fontStyle: "italic",
              letterSpacing: ".01em",
            }}>
              {article.excerpt}
            </p>

            {/* Nội dung chính */}
            <div style={{ fontSize: 16.5, color: "var(--ink-2)" }}>
              <ArticleContent content={article.content} />
            </div>

            {/* Thẻ — bấm vào để xem các bài cùng thẻ */}
            {article.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 36 }}>
                {article.tags.map(tag => (
                  <Link
                    key={tag}
                    to={`/news?tag=${encodeURIComponent(tag)}`}
                    style={{
                      background: "var(--mint)", color: "var(--green-ink)",
                      padding: "5px 13px", borderRadius: 999,
                      fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                      transition: ".18s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--mint-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--mint)"}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Footer của bài */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 40,
              paddingTop: 24,
              borderTop: "1px solid var(--line)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "var(--mint)", color: "var(--green-ink)",
                  display: "grid", placeItems: "center",
                }}>
                  <Icon name="leaf" size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{article.author}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {article.date} · {article.views?.toLocaleString("vi-VN")} lượt xem
                  </div>
                </div>
              </div>
              <Link
                to="/news"
                className="btn-pill ghost"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}
              >
                <Icon name="arrowL" size={15} />
                Tất cả bài viết
              </Link>
            </div>
          </div>

          {/* Bài viết liên quan */}
          {related.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <h2 style={{
                fontSize: 20, fontWeight: 800, color: "var(--green-ink)",
                marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ width: 4, height: 22, background: "var(--green)", borderRadius: 2, display: "inline-block" }} />
                Bài viết liên quan
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {related.map(n => (
                  <Link
                    key={n.id}
                    to={`/news/${n.slug || n.id}`}
                    style={{
                      display: "block", borderRadius: "var(--radius)", overflow: "hidden",
                      background: "#fff", border: "1px solid var(--line)",
                      transition: ".2s", textDecoration: "none",
                      boxShadow: "var(--shadow-sm)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""}
                  >
                    <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                      <Img
                        src={n.img}
                        alt={n.title}
                        label="ảnh tin tức"
                        style={{ transition: ".4s", width: "100%", height: "100%" }}
                      />
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                        {n.category?.name ? `${n.category.name} · ` : ""}{n.date}
                      </div>
                      <h4 style={{
                        fontSize: 14, fontWeight: 700, color: "var(--green-ink)",
                        margin: 0, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {n.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
