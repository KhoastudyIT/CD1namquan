import { useState, useEffect } from "react";
import { Icon } from "./ui.jsx";
import { ProductCard } from "./cards.jsx";
import { api } from "../api.js";

export function NewArrivals({ favs, onFav, onAdd }) {
  const [tab, setTab] = useState(0);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabs = ["Hàng mới về", "Bán chạy"];

  useEffect(() => {
    setLoading(true);
    const sort = tab === 0 ? "newest" : "sold";
    api.getProducts({ sort, limit: 4 })
      .then(data => {
        if (Array.isArray(data)) setList(data.slice(0, 4));
        else if (data?.data) setList(data.data.slice(0, 4));
      })
      .catch(err => console.error("NewArrivals fetch error:", err))
      .finally(() => setLoading(false));
  }, [tab]);

  if (loading) return (
    <section className="section" style={{ paddingTop: 10 }}>
      <div className="wrap">
        <div className="green-band" style={{ display: "flex", gap: 16, padding: 24 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skel-block" style={{ flex: 1, height: 280, borderRadius: 10 }} />)}
        </div>
      </div>
    </section>
  );

  if (!list.length) return null;

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
