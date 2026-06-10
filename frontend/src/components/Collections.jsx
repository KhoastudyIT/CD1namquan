import { Img, Icon } from "./ui.jsx";
import { collections } from "../data.js";

export function Collections() {
  return (
    <section className="section" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="coll-grid">
          {collections.map((c, i) => (
            <a key={c.name} className="coll reveal" href="#showroom" style={{ animationDelay: (i * 0.08) + "s" }}>
              <Img src={c.img} alt={c.name} label="ảnh bộ sưu tập" />
              <div className="coll-label">
                <b>{c.name}</b>
                <span className="go">Khám phá <Icon name="arrow" size={14} /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
