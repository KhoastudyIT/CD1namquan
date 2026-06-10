import { useState } from "react";
import { Icon, toast } from "./ui.jsx";
import { ProductCard } from "./cards.jsx";
import { products, cats } from "../data.js";

export function Showroom({ favs, onFav, onAdd }) {
  const [cat, setCat] = useState("Tất cả");
  const [sale, setSale] = useState(false);
  const catList = ["Tất cả", ...cats];
  const filters = ["Loại sản phẩm", "Giá", "Màu sắc", "Phong cách", "Chất liệu", "Kích thước", "Thương hiệu"];

  let list = products.filter((p) => cat === "Tất cả" || p.cat === cat);
  if (sale) list = [...list].sort((a, b) => a.price - b.price);

  return (
    <section className="section showroom" id="showroom">
      <div className="wrap">
        <span className="eyebrow" style={{ display: "block", textAlign: "center" }}>Phòng trưng bày Nam Quan</span>
        <h2 className="sec-title" style={{ marginTop: 8 }}>Mỗi không gian một câu chuyện</h2>

        <div className="chip-tabs reveal">
          {catList.map((c) => (
            <button key={c} className={"chip-tab" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        <div className="filters reveal">
          <button className={"filter-pill lead" + (sale ? " on" : "")} onClick={() => setSale((v) => !v)}>
            <Icon name="filter" size={14} /> {sale ? "Giá: Thấp → Cao" : "Bộ lọc"}
          </button>
          {filters.map((f) => (
            <button key={f} className="filter-pill">{f} <Icon name="chevD" size={13} /></button>
          ))}
        </div>

        <div className="grid4 showroom-grid">
          {list.length === 0
            ? <div className="empty">Chưa có sản phẩm trong danh mục này.</div>
            : list.map((p) => (
                <ProductCard key={p.id} p={p} fav={favs.has(p.id)} onFav={onFav} onAdd={onAdd} />
              ))}
        </div>

        <div className="center-cta">
          <button className="btn-pill" onClick={() => toast("Đang tải thêm sản phẩm…")}>Xem tất cả <Icon name="arrow" size={16} /></button>
        </div>
      </div>
    </section>
  );
}
