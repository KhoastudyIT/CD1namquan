import { useState, useEffect } from "react";
import { CategoryPill } from "./cards.jsx";
import { api } from "../api.js";

export function Categories({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(data => {
      if (data) setCategories(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="section" style={{ paddingBottom: 30 }}>
      <div className="wrap">
        <div className="cats">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="catpill">
              <div className="catpill-media skel-block" />
              <div className="skel-block" style={{ width: 70, height: 14, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (!categories.length) return null;

  return (
    <section className="section" style={{ paddingBottom: 30 }}>
      <div className="wrap">
        <div className="cats reveal">
          {categories.map((c) => (
            <CategoryPill key={c.id || c.name} c={c} onClick={onSelectCategory} />
          ))}
        </div>
      </div>
    </section>
  );
}
