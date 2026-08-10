import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Img, Icon } from "./ui.jsx";
import { api } from "../api.js";

export function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCollections()
      .then(data => {
        if (Array.isArray(data)) setCollections(data);
        else if (data?.data) setCollections(data.data);
      })
      .catch(err => console.error("Collections fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="section" id="collections" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="coll-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skel-block" style={{ height: 220, borderRadius: 12 }} />)}
        </div>
      </div>
    </section>
  );

  if (!collections.length) return null;

  return (
    <section className="section" id="collections" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="coll-grid">
          {collections.map((c, i) => (
            <Link
              key={c.id || c.name}
              className="coll reveal"
              to={`/shop?search=${encodeURIComponent(c.name.replace(/^BST\s+/i, ''))}`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ animationDelay: (i * 0.08) + "s" }}
            >
              <Img src={c.img} alt={c.name} label="ảnh bộ sưu tập" />
              <div className="coll-label">
                <b>{c.name}</b>
                <span className="go">Khám phá <Icon name="arrow" size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
