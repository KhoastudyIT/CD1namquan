import { useState, useEffect } from "react";
import { CategoryPill } from "./cards.jsx";
import { api } from "../api.js";

export function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getCategories().then(data => {
      if (data) setCategories(data);
    });
  }, []);

  if (!categories.length) return null;

  return (
    <section className="section" style={{ paddingBottom: 30 }}>
      <div className="wrap">
        <div className="cats reveal">
          {categories.map((c) => <CategoryPill key={c.id || c.name} c={c} />)}
        </div>
      </div>
    </section>
  );
}
