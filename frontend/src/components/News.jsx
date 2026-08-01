import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { NewsCard } from "./cards.jsx";
import { Icon } from "./ui.jsx";
import { api } from "../api.js";

export function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Chỉ lấy 3 bài mới nhất cho khối tin tức ở trang chủ
    api.getNews({ limit: 3 })
      .then(data => {
        if (Array.isArray(data)) setNews(data);
        else if (data?.data) setNews(data.data);
      })
      .catch(err => console.error("News fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="section news-sec" id="news">
      <div className="wrap">
        <div className="news-grid">
          {[1, 2, 3].map(i => <div key={i} className="skel-block" style={{ height: 320, borderRadius: 10 }} />)}
        </div>
      </div>
    </section>
  );

  if (!news.length) return null;

  return (
    <section className="section news-sec" id="news">
      <div className="wrap">
        <h2 className="sec-title">Tin tức</h2>
        <p className="sec-sub">Cập nhật xu hướng thiết kế, mẹo bài trí và cảm hứng cho không gian sống của bạn.</p>
        <div className="news-grid">
          {news.map((n, i) => (
            <div key={n.id || n.title} className="reveal" style={{ animationDelay: (i * 0.08) + "s" }}>
              <NewsCard n={n} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 34 }}>
          <Link to="/news" className="btn-pill ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            Xem tất cả bài viết <Icon name="arrow" size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
