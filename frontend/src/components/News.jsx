import { useState, useEffect } from "react";
import { NewsCard } from "./cards.jsx";
import { api } from "../api.js";

export function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    api.getNews().then(data => {
      if (data) setNews(data);
    });
  }, []);

  if (!news.length) return null;

  return (
    <section className="section news-sec" id="news">
      <div className="wrap">
        <h2 className="sec-title">Tin tức</h2>
        <p className="sec-sub">Cập nhật xu hướng thiết kế, mẹo bài trí và cảm hứng cho không gian sống của bạn.</p>
        <div className="news-grid">
          {news.map((n, i) => (
            <div key={n.id || n.title} className="reveal" style={{ animationDelay: (i * 0.08) + "s" }}><NewsCard n={n} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
