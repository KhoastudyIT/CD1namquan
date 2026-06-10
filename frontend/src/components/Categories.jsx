import { CategoryPill } from "./cards.jsx";
import { categories } from "../data.js";

export function Categories() {
  return (
    <section className="section" style={{ paddingBottom: 30 }}>
      <div className="wrap">
        <div className="cats reveal">
          {categories.map((c) => <CategoryPill key={c.name} c={c} />)}
        </div>
      </div>
    </section>
  );
}
