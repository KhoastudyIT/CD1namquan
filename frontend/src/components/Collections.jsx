import { useState, useEffect } from "react";
import { Img, Icon } from "./ui.jsx";
import { api } from "../api.js";

export function Collections() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    api.getCollections().then(data => {
      if (data) setCollections(data);
    });
  }, []);

  if (!collections.length) return null;

  return (
    <section className="section" id="collections" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="coll-grid">
          {collections.map((c, i) => (
            <a key={c.id || c.name} className="coll reveal" href="#showroom" style={{ animationDelay: (i * 0.08) + "s" }}>
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
