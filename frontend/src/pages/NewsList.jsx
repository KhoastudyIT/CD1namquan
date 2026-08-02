import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { NewsCard } from "../components/cards.jsx";
import { Img, Icon } from "../components/ui.jsx";

const LIMIT = 9;

/**
 * Rút gọn dãy số trang quanh trang hiện tại, luôn giữ trang đầu và trang cuối.
 * Render đủ 20 trang thì trên điện thoại thanh phân trang tràn thành mấy hàng.
 * Trả về mảng số, `null` là chỗ hiện dấu "…".
 */
function pageWindow(current, total, span = 1) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total]);
  for (let p = current - span; p <= current + span; p++) {
    if (p > 1 && p < total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) =>
    i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]
  );
}

const SORT_OPTIONS = [
  { value: "newest",  label: "🕒 Mới nhất" },
  { value: "popular", label: "🔥 Xem nhiều nhất" },
  { value: "oldest",  label: "📜 Cũ nhất" },
];

// Bài nổi bật chỉ hiện khi đang xem trang 1 và không lọc gì — tránh việc
// người dùng lọc theo danh mục nhưng vẫn thấy bài không thuộc danh mục đó.
function FeaturedArticle({ article }) {
  const href = `/news/${article.slug || article.id}`;
  return (
    <Link to={href} className="news-featured">
      <div className="news-featured-media">
        <Img
          src={article.img}
          alt={article.title}
          label="ảnh bài viết nổi bật"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span className="news-featured-badge">⭐ NỔI BẬT</span>
      </div>

      <div className="news-featured-body">
        {article.category && (
          <span className="news-featured-cat">{article.category.name}</span>
        )}
        <h2 className="news-featured-title">{article.title}</h2>
        <div className="news-featured-meta">
          {article.date} · {article.readingTime} phút đọc · {article.views?.toLocaleString("vi-VN")} lượt xem
        </div>
        <p className="news-featured-ex">{article.excerpt}</p>
        <span className="news-more">Đọc bài viết <Icon name="arrow" size={15} /></span>
      </div>
    </Link>
  );
}

export function NewsList() {
  // Bộ lọc nằm trên URL để chia sẻ/bookmark được và nút back hoạt động đúng.
  const [searchParams, setSearchParams] = useSearchParams();
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const category = searchParams.get("category") || "";
  const tag      = searchParams.get("tag") || "";
  const search   = searchParams.get("q") || "";
  const sort     = searchParams.get("sort") || "newest";

  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const hasFilters = Boolean(category || tag || search);

  // Ô tìm kiếm phải theo kịp khi người dùng bấm back/forward
  useEffect(() => { setSearchInput(search); }, [search]);

  useEffect(() => {
    api.getNewsCategories()
      .then(data => setCategories(data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page, limit: LIMIT, sort };
    if (category) params.category = category;
    if (tag) params.tag = tag;
    if (search) params.search = search;

    api.getNewsPaginated(params)
      .then(res => {
        if (cancelled) return;
        setArticles(res.data || []);
        if (res.meta) setMeta(res.meta);
      })
      .catch(() => { if (!cancelled) setArticles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, category, tag, search, sort]);

  // Bài nổi bật chỉ tải một lần, dùng cho trang 1 không lọc
  useEffect(() => {
    api.getNews({ featured: "true", limit: 1 })
      .then(data => setFeatured(Array.isArray(data) && data.length ? data[0] : null))
      .catch(() => {});
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [page, category, tag, search, sort]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Tin tức & bài viết | NAM QUAN";
    return () => { document.title = previous; };
  }, []);

  // Đổi bộ lọc luôn đưa về trang 1; bỏ khỏi URL khi giá trị rỗng cho gọn.
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in changes)) next.delete("page");
    setSearchParams(next);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    setSearchParams(next);
  };

  const showFeatured = Boolean(featured) && page === 1 && !hasFilters;

  // Ẩn bài nổi bật khỏi lưới để không hiển thị hai lần
  const gridArticles = showFeatured ? articles.filter(a => a.id !== featured.id) : articles;

  return (
    <div style={{ background: "var(--paper-2)", minHeight: "80vh", padding: "32px 0 64px" }}>
      <div className="wrap">

        {/* Banner */}
        <div className="shop-banner">
          <div>
            <h1>Tin tức & bài viết</h1>
            <p>Xu hướng thiết kế, mẹo bài trí và cẩm nang chọn mua nội thất từ đội ngũ NAM QUAN</p>
          </div>
          <div className="shop-banner-right">📰</div>
        </div>

        {/* Lọc theo danh mục — mobile cuộn ngang một hàng */}
        <div className="news-cats">
          <button
            className={"news-cat-btn" + (!category ? " active" : "")}
            onClick={() => updateParams({ category: "", tag: "" })}
          >
            Tất cả
          </button>
          {categories.filter(c => c.articleCount > 0).map(c => (
            <button
              key={c.id}
              className={"news-cat-btn" + (category === c.slug ? " active" : "")}
              onClick={() => updateParams({ category: c.slug, tag: "" })}
            >
              {c.name} <span className="count">({c.articleCount})</span>
            </button>
          ))}
        </div>

        {/* Tìm kiếm + sắp xếp — mobile xếp dọc */}
        <div className="news-toolbar">
          <form
            className="news-search"
            onSubmit={e => { e.preventDefault(); updateParams({ q: searchInput.trim() }); }}
          >
            <div className="news-search-box">
              <Icon name="search" size={17} style={{ color: "var(--muted)" }} />
              <input
                type="search"
                placeholder="Tìm bài viết (không cần gõ dấu)..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-pill" style={{ padding: "0 22px", fontSize: 14 }}>Tìm</button>
          </form>

          <select
            className="news-sort"
            value={sort}
            onChange={e => updateParams({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Bộ lọc đang áp dụng */}
        {hasFilters && (
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", marginBottom: 20, fontSize: 13.5 }}>
            <span style={{ color: "var(--muted)" }}>
              {loading ? "Đang tìm..." : `${meta.total} bài viết`}
            </span>
            {search && (
              <button onClick={() => updateParams({ q: "" })} style={chipStyle}>
                Từ khóa: “{search}” ✕
              </button>
            )}
            {tag && (
              <button onClick={() => updateParams({ tag: "" })} style={chipStyle}>
                Thẻ: #{tag} ✕
              </button>
            )}
            {category && (
              <button onClick={() => updateParams({ category: "" })} style={chipStyle}>
                {categories.find(c => c.slug === category)?.name || category} ✕
              </button>
            )}
          </div>
        )}

        {/* Nội dung */}
        {loading ? (
          <div className="news-grid" style={{ marginTop: 0 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 330, borderRadius: "var(--radius)", background: "linear-gradient(135deg,#eef3ef,#e3ece5)" }} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="shop-empty">
            <div style={{ fontSize: 42 }}>📭</div>
            <p>Không tìm thấy bài viết nào phù hợp.</p>
            {hasFilters && (
              <button
                onClick={() => setSearchParams(new URLSearchParams())}
                style={{
                  marginTop: 14, padding: "9px 22px", borderRadius: 9,
                  border: "1px solid var(--line)", background: "var(--mint)",
                  color: "var(--green-ink)", fontWeight: 600, cursor: "pointer",
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            {showFeatured && <FeaturedArticle article={featured} />}

            <div className="news-grid" style={{ marginTop: 0 }}>
              {gridArticles.map(n => <NewsCard key={n.id} n={n} />)}
            </div>

            {meta.totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => goToPage(page - 1)}>‹</button>
                {pageWindow(page, meta.totalPages).map((p, i) => (
                  p === null
                    ? <span key={`gap-${i}`} className="page-gap">…</span>
                    : (
                      <button
                        key={p}
                        className={"page-btn" + (p === page ? " active" : "")}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    )
                ))}
                <button className="page-btn" disabled={page === meta.totalPages} onClick={() => goToPage(page + 1)}>›</button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

const chipStyle = {
  background: "var(--mint)", color: "var(--green-ink)",
  border: "1px solid var(--mint-3)", borderRadius: 999,
  padding: "5px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
