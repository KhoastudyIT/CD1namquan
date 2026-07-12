import { useState, useEffect } from "react";
import { Icon, toast } from "./ui.jsx";
import { ProductCard } from "./cards.jsx";
import { api } from "../api.js";

export function Showroom({ favs, onFav, onAdd }) {
  const [cat, setCat] = useState("Tất cả");
  const [sale, setSale] = useState(false);
  const [cats, setCats] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const filters = ["Loại sản phẩm", "Giá", "Màu sắc", "Phong cách", "Chất liệu", "Kích thước", "Thương hiệu"];

  useEffect(() => {
    api.getCategories().then(data => {
      if (data) setCats(data.map(c => c.name));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 8 };
    if (cat !== "Tất cả") params.category = cat;
    if (sale) params.sort = "price_asc";
    
    api.getProducts(params).then(data => {
      if (Array.isArray(data)) setList(data);
      else if (data?.data && Array.isArray(data.data)) setList(data.data);
      else setList([]);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, [cat, sale]);


  const catList = ["Tất cả", ...cats];

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
          {loading
            ? [1,2,3,4,5,6,7,8].map(i => <div key={i} className="skel-block" style={{ height: 280, borderRadius: 14 }} />)
            : list.length === 0
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
