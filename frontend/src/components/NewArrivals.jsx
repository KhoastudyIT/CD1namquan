import { useState } from "react";
import { Icon } from "./ui.jsx";
import { ProductCard } from "./cards.jsx";
import { products } from "../data.js";

export function NewArrivals({ favs, onFav, onAdd }) {
  const [tab, setTab] = useState(0);
  const tabs = ["Hàng mới về", "Bán chạy"];
  const list = tab === 0
    ? products.slice(0, 4)
    : [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
  return (
    <section className="section" style={{ paddingTop: 10 }}>
      <div className="wrap">
        <div className="tabbar reveal">
          {tabs.map((t, i) => (
            <button key={t} className={"tab" + (tab === i ? " active" : "")} onClick={() => setTab(i)}>{t}</button>
          ))}
          <a className="tab-link" href="#showroom">Xem tất cả <Icon name="arrow" size={15} /></a>
        </div>
        <div className="green-band reveal">
          <div className="grid4">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} fav={favs.has(p.id)} onFav={onFav} onAdd={onAdd} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
