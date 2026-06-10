import { NewsCard } from "./cards.jsx";
import { news } from "../data.js";

export function News() {
  return (
    <section className="section news-sec">
      <div className="wrap">
        <h2 className="sec-title">Tin tức</h2>
        <p className="sec-sub">Cập nhật xu hướng thiết kế, mẹo bài trí và cảm hứng cho không gian sống của bạn.</p>
        <div className="news-grid">
          {news.map((n, i) => (
            <div key={n.title} className="reveal" style={{ animationDelay: (i * 0.08) + "s" }}><NewsCard n={n} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
