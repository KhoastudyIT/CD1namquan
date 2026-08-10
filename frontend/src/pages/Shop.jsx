import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { ProductCard } from "../components/cards.jsx";
import { Icon } from "../components/ui.jsx";

/* ─── Dữ liệu bộ lọc ─── */
const PRICE_MAX = 50000000;
const PRICE_PRESETS = [
  { label: "Tất cả giá", min: 0, max: PRICE_MAX },
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 – 15 triệu", min: 5000000, max: 15000000 },
  { label: "15 – 30 triệu", min: 15000000, max: 30000000 },
  { label: "Trên 30 triệu", min: 30000000, max: PRICE_MAX },
];

const COLOR_OPTIONS = [
  { key: "trang",     label: "Trắng",      hex: "#f5f5f0", border: "#ddd" },
  { key: "be",        label: "Be / Kem",   hex: "#e8d9b5", border: "#c9b88a" },
  { key: "nau",       label: "Nâu gỗ",     hex: "#8b5e3c", border: "#6b4020" },
  { key: "den",       label: "Đen",        hex: "#1a1a1a", border: "#555" },
  { key: "xanh-la",  label: "Xanh lá",    hex: "#2d7a4f", border: "#1f5a38" },
  { key: "xanh-lam", label: "Xanh lam",   hex: "#3a6b9f", border: "#2a5080" },
  { key: "vang",     label: "Vàng đồng",  hex: "#c9a843", border: "#9a7c28" },
  { key: "hong",     label: "Hồng",       hex: "#e8a0a8", border: "#c47880" },
  { key: "xam",      label: "Xám",        hex: "#9da8b0", border: "#6e7c87" },
];

const STYLE_OPTIONS = [
  "Hiện đại", "Tân cổ điển", "Tối giản", "Rustic", "Bắc Âu", "Luxury",
];
const MATERIAL_OPTIONS = [
  "Gỗ tự nhiên", "Gỗ MDF", "Da thật", "Da PU", "Vải linen", "Mây tre", "Kim loại", "Kính cường lực",
];
const SIZE_OPTIONS = [
  "Nhỏ (< 1m)", "Vừa (1 – 1.8m)", "Lớn (> 1.8m)", "2 chỗ", "3 chỗ", "King size",
];
const BRAND_OPTIONS = [
  "Nam Quan", "MOHO", "Nội thất Hòa Phát", "IKEA Style", "Haven", "Homie",
];

/* ─── Dropdown wrapper ─── */
function FilterDropdown({ label, active, children, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="fdd-wrap" ref={ref}>
      <button
        className={"fdd-trigger" + (active ? " fdd-active" : "") + (open ? " fdd-open" : "")}
        onClick={() => setOpen(o => !o)}
      >
        <span>{label}</span>
        {active && <span className="fdd-badge" />}
        <svg className={"fdd-arrow" + (open ? " up" : "")} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="fdd-panel">
          {onClear && active && (
            <button className="fdd-clear" onClick={() => { onClear(); setOpen(false); }}>
              ✕ Xóa bộ lọc này
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Main Shop ─── */
export function Shop() {
  const { favs, toggleFav, addToCart } = useAppContext();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // ── Bộ lọc giá ──
  const [pricePreset, setPricePreset] = useState(0); // index into PRICE_PRESETS
  const priceMin = PRICE_PRESETS[pricePreset].min;
  const priceMax = PRICE_PRESETS[pricePreset].max;

  // ── Màu sắc ──
  const [selectedColors, setSelectedColors] = useState([]);

  // ── Phong cách ──
  const [selectedStyles, setSelectedStyles] = useState([]);

  // ── Chất liệu ──
  const [selectedMaterials, setSelectedMaterials] = useState([]);

  // ── Kích thước ──
  const [selectedSizes, setSelectedSizes] = useState([]);

  // ── Thương hiệu ──
  const [selectedBrands, setSelectedBrands] = useState([]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const cat = params.get("category") || params.get("cat");
    if (q !== null) { setSearch(q); setSearchInput(q); setPage(1); }
    if (cat !== null) { setCategory(cat); setPage(1); }
  }, [location.search]);

  useEffect(() => {
    api.getCategories()
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => { });
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT, sort };
    if (search) params.search = search;
    if (category) params.category = category;
    if (priceMin > 0) params.priceMin = priceMin;
    if (priceMax < PRICE_MAX) params.priceMax = priceMax;
    if (selectedColors.length) params.colors = selectedColors.join(",");
    if (selectedStyles.length) params.styles = selectedStyles.join(",");
    if (selectedMaterials.length) params.materials = selectedMaterials.join(",");
    if (selectedSizes.length) params.sizes = selectedSizes.join(",");
    if (selectedBrands.length) params.brands = selectedBrands.join(",");

    api.getProductsPaginated(params)
      .then(res => {
        if (res && res.data) { setProducts(res.data); if (res.meta) setMeta(res.meta); }
        else if (Array.isArray(res)) setProducts(res);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [search, category, sort, page, priceMin, priceMax, selectedColors, selectedStyles, selectedMaterials, selectedSizes, selectedBrands]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggle = (setter) => (key) => {
    setter(prev => prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch(""); setSearchInput(""); setCategory(""); setSort("newest");
    setPricePreset(0); setSelectedColors([]); setSelectedStyles([]);
    setSelectedMaterials([]); setSelectedSizes([]); setSelectedBrands([]);
    setPage(1);
  };

  const hasActiveFilters = search || category || pricePreset !== 0 ||
    selectedColors.length || selectedStyles.length ||
    selectedMaterials.length || selectedSizes.length || selectedBrands.length;

  const totalPages = meta ? meta.totalPages || 1 : 1;
  const total = meta ? meta.total || products.length : products.length;

  const getPageNums = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  /* ── Active filter tags (chips below bar) ── */
  const activeTags = [];
  if (category) activeTags.push({ label: category, onRemove: () => setCategory("") });
  if (pricePreset !== 0) activeTags.push({ label: PRICE_PRESETS[pricePreset].label, onRemove: () => setPricePreset(0) });
  selectedColors.forEach(k => {
    const c = COLOR_OPTIONS.find(o => o.key === k);
    if (c) activeTags.push({ label: c.label, color: c.hex, onRemove: () => toggle(setSelectedColors)(k) });
  });
  selectedStyles.forEach(s => activeTags.push({ label: s, onRemove: () => toggle(setSelectedStyles)(s) }));
  selectedMaterials.forEach(m => activeTags.push({ label: m, onRemove: () => toggle(setSelectedMaterials)(m) }));
  selectedSizes.forEach(s => activeTags.push({ label: s, onRemove: () => toggle(setSelectedSizes)(s) }));
  selectedBrands.forEach(b => activeTags.push({ label: b, onRemove: () => toggle(setSelectedBrands)(b) }));

  return (
    <div style={{ background: "var(--paper-2)", minHeight: "80vh", padding: "32px 0 64px" }}>
      <div className="wrap">

        {/* Banner */}
        <div className="shop-banner">
          <div>
            <h1>Cửa hàng nội thất</h1>
            <p>Khám phá hơn {total}+ sản phẩm cao cấp — từ phòng khách đến không gian bếp</p>
          </div>
          <div className="shop-banner-right">🛋️</div>
        </div>

        {/* ══════════ HORIZONTAL FILTER BAR ══════════ */}
        <div className="hfb-outer">
          <div className="hfb">

            {/* Nút Bộ lọc */}
            <button className={"hfb-main-btn" + (hasActiveFilters ? " active" : "")} onClick={clearAllFilters}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M1 3h13M3.5 7.5h8M6 12h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Bộ lọc
              {hasActiveFilters && <span className="hfb-count">{activeTags.length}</span>}
            </button>

            <div className="hfb-divider" />

            {/* Loại sản phẩm */}
            <FilterDropdown
              label={category || "Loại sản phẩm"}
              active={!!category}
              onClear={() => setCategory("")}
            >
              <div className="fdd-list">
                <button className={"fdd-item" + (!category ? " active" : "")} onClick={() => setCategory("")}>
                  🏠 Tất cả sản phẩm
                </button>
                {categories.map(c => (
                  <button
                    key={c.id || c.name}
                    className={"fdd-item" + (category === c.name ? " active" : "")}
                    onClick={() => { setCategory(c.name); setPage(1); }}
                  >
                    ▸ {c.name}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Giá */}
            <FilterDropdown
              label={pricePreset !== 0 ? PRICE_PRESETS[pricePreset].label : "Giá"}
              active={pricePreset !== 0}
              onClear={() => setPricePreset(0)}
            >
              <div className="fdd-list">
                {PRICE_PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    className={"fdd-item" + (pricePreset === i ? " active" : "")}
                    onClick={() => { setPricePreset(i); setPage(1); }}
                  >
                    {i === 0 ? "💰 " : i === 1 ? "↓ " : i === 4 ? "↑ " : "↔ "}
                    {p.label}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Màu sắc */}
            <FilterDropdown
              label={selectedColors.length ? `Màu sắc (${selectedColors.length})` : "Màu sắc"}
              active={selectedColors.length > 0}
              onClear={() => setSelectedColors([])}
            >
              <div className="fdd-colors">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.key}
                    className={"fdd-color-item" + (selectedColors.includes(c.key) ? " active" : "")}
                    onClick={() => toggle(setSelectedColors)(c.key)}
                    style={{ "--sw": c.hex, "--swb": c.border }}
                  >
                    <span className="fdd-color-dot">
                      {selectedColors.includes(c.key) && <span className="fdd-color-check">✓</span>}
                    </span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Phong cách */}
            <FilterDropdown
              label={selectedStyles.length ? `Phong cách (${selectedStyles.length})` : "Phong cách"}
              active={selectedStyles.length > 0}
              onClear={() => setSelectedStyles([])}
            >
              <div className="fdd-list">
                {STYLE_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={"fdd-item fdd-check-item" + (selectedStyles.includes(s) ? " active" : "")}
                    onClick={() => toggle(setSelectedStyles)(s)}
                  >
                    <span className={"fdd-checkbox" + (selectedStyles.includes(s) ? " checked" : "")} />
                    {s}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Chất liệu */}
            <FilterDropdown
              label={selectedMaterials.length ? `Chất liệu (${selectedMaterials.length})` : "Chất liệu"}
              active={selectedMaterials.length > 0}
              onClear={() => setSelectedMaterials([])}
            >
              <div className="fdd-list">
                {MATERIAL_OPTIONS.map(m => (
                  <button
                    key={m}
                    className={"fdd-item fdd-check-item" + (selectedMaterials.includes(m) ? " active" : "")}
                    onClick={() => toggle(setSelectedMaterials)(m)}
                  >
                    <span className={"fdd-checkbox" + (selectedMaterials.includes(m) ? " checked" : "")} />
                    {m}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Kích thước */}
            <FilterDropdown
              label={selectedSizes.length ? `Kích thước (${selectedSizes.length})` : "Kích thước"}
              active={selectedSizes.length > 0}
              onClear={() => setSelectedSizes([])}
            >
              <div className="fdd-list">
                {SIZE_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={"fdd-item fdd-check-item" + (selectedSizes.includes(s) ? " active" : "")}
                    onClick={() => toggle(setSelectedSizes)(s)}
                  >
                    <span className={"fdd-checkbox" + (selectedSizes.includes(s) ? " checked" : "")} />
                    {s}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Thương hiệu */}
            <FilterDropdown
              label={selectedBrands.length ? `Thương hiệu (${selectedBrands.length})` : "Thương hiệu"}
              active={selectedBrands.length > 0}
              onClear={() => setSelectedBrands([])}
            >
              <div className="fdd-list">
                {BRAND_OPTIONS.map(b => (
                  <button
                    key={b}
                    className={"fdd-item fdd-check-item" + (selectedBrands.includes(b) ? " active" : "")}
                    onClick={() => toggle(setSelectedBrands)(b)}
                  >
                    <span className={"fdd-checkbox" + (selectedBrands.includes(b) ? " checked" : "")} />
                    {b}
                  </button>
                ))}
              </div>
            </FilterDropdown>
          </div>

          {/* Active filter tags */}
          {activeTags.length > 0 && (
            <div className="hfb-tags">
              {activeTags.map((tag, i) => (
                <span key={i} className="hfb-tag">
                  {tag.color && (
                    <span className="hfb-tag-dot" style={{ background: tag.color }} />
                  )}
                  {tag.label}
                  <button className="hfb-tag-x" onClick={tag.onRemove}>✕</button>
                </span>
              ))}
              {activeTags.length > 1 && (
                <button className="hfb-clear-all" onClick={clearAllFilters}>Xóa tất cả</button>
              )}
            </div>
          )}
        </div>

        {/* ══════════ PRODUCT AREA ══════════ */}
        <div className="shop-top-bar">
          {/* Search */}
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput); }} className="shop-search-wrap shop-search-inline">
            <input
              type="text"
              className="shop-search-input"
              placeholder="Tìm sản phẩm..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="shop-search-btn" aria-label="Tìm kiếm">
              <Icon name="search" size={15} />
            </button>
          </form>

          <div className="shop-top-right">
            <span className="shop-count">{loading ? "Đang tải..." : `${total} sản phẩm`}</span>
            <select
              className="sort-select sort-select-sm"
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
            >
              <option value="newest">🆕 Mới nhất</option>
              <option value="price_asc">💰 Giá thấp → cao</option>
              <option value="price_desc">💎 Giá cao → thấp</option>
              <option value="rating">⭐ Đánh giá cao</option>
              <option value="sold">🔥 Bán chạy</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="shop-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "1/1.4", background: "linear-gradient(135deg,#eef3ef,#e3ece5)", borderRadius: 14 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty">
            <div style={{ fontSize: 42 }}>🔍</div>
            <p>Không tìm thấy sản phẩm nào phù hợp.</p>
            <button onClick={clearAllFilters} style={{ marginTop: 14, padding: "9px 22px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--mint)", color: "var(--green-ink)", fontWeight: 600, cursor: "pointer" }}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="shop-grid">
              {products.map(p => (
                <ProductCard key={p.id} p={p} fav={favs.has(p.id)} onFav={toggleFav} onAdd={addToCart} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {page > 3 && (
                  <>
                    <button className="page-btn" onClick={() => setPage(1)}>1</button>
                    {page > 4 && <span style={{ color: "var(--muted)", alignSelf: "center" }}>…</span>}
                  </>
                )}
                {getPageNums().map(num => (
                  <button key={num} className={"page-btn" + (num === page ? " active" : "")} onClick={() => setPage(num)}>{num}</button>
                ))}
                {page < totalPages - 2 && (
                  <>
                    {page < totalPages - 3 && <span style={{ color: "var(--muted)", alignSelf: "center" }}>…</span>}
                    <button className="page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>
                  </>
                )}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
