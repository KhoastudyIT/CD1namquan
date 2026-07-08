import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { Img, Icon, toast } from "../components/ui.jsx";

export function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.getNewsById(id)
      .then(data => {
        if (data) setArticle(data);
      })
      .catch(err => {
        toast(err.message || "Không tìm thấy bài viết");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    api.getNews()
      .then(data => {
        if (Array.isArray(data)) {
          setRelated(data.filter(n => String(n.id) !== String(id)).slice(0, 3));
        }
      })
      .catch(() => {});
  }, [id]);

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
            <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>Tin tức</span>
          </nav>

          {/* Date badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--green)", color: "#fff",
            padding: "5px 14px", borderRadius: 999,
            fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
            marginBottom: 14, width: "fit-content",
          }}>
            <Icon name="bell" size={12} stroke={2} />
            {article.date}
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
        <div className="wrap" style={{ maxWidth: 900 }}>

          {/* Card nội dung chính */}
          <div style={{
            background: "#fff",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            padding: "48px 56px",
            marginTop: "-60px",
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
            <div style={{
              fontSize: 16.5,
              color: "var(--ink-2)",
              lineHeight: 1.85,
              whiteSpace: "pre-wrap",
            }}>
              {article.content}
            </div>

            {/* Footer của bài */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 48,
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Đội ngũ NAM QUAN</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Nội thất cao cấp · {article.date}</div>
                </div>
              </div>
              <Link
                to="/"
                className="btn-pill ghost"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}
              >
                <Icon name="arrowL" size={15} />
                Quay về trang chủ
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
                    to={`/news/${n.id}`}
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
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{n.date}</div>
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
