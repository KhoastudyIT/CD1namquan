/* ============ NAM QUAN — cards ============ */
import { Img, Icon, Stars, ColorDots, vnd, priceOf, discountPct } from "./ui.jsx";
import { Link } from "react-router-dom";
import { useAppContext } from "../context.js";

export function FavBtn({ active, onClick }) {
  return (
    <button className="fav-btn" onClick={onClick} aria-label="Yêu thích"
      style={{
        width: 30, height: 30, borderRadius: "50%", background: "#fff",
        display: "grid", placeItems: "center", boxShadow: "var(--shadow-sm)",
        color: active ? "#e6457a" : "var(--muted)", transition: ".2s",
      }}>
      <Icon name="heart" size={15} fill={active ? "#e6457a" : "none"} stroke={1.7} />
    </button>
  );
}

export function ProductCard({ p, fav, onFav, onAdd, onBuy }) {
  const { buyNow } = useAppContext() || {};
  const handleBuy = onBuy || ((prod) => buyNow && buyNow(prod));
  const { price, listPrice, hasDiscount, discountPct: discPct } = priceOf(p);

  return (
    <div className="pcard">
      <div className="pcard-media">
        {hasDiscount && <span className="flash-tag">-{discPct}%</span>}
        <Link to={`/product/${p.id}`} style={{ display: 'block', height: '100%' }}>
          <Img src={p.img} alt={p.name} label="ảnh sản phẩm" />
        </Link>
        <div className="pcard-tools">
          <FavBtn active={fav} onClick={() => onFav(p.id)} />
          <button className="pcard-cart" onClick={() => onAdd(p)} aria-label="Thêm giỏ hàng" title="Thêm vào giỏ">
            <Icon name="cart" size={15} stroke={1.7} />
          </button>
          <button className="pcard-buy" onClick={() => handleBuy(p)} aria-label="Mua ngay" title="Mua ngay">
            ⚡
          </button>
        </div>
      </div>
      <div className="pcard-body">
        <div className="pcard-type">{p.type}</div>
        <Link to={`/product/${p.id}`} className="pcard-name" style={{ color: 'inherit' }}>{p.name}</Link>
        <div className="pcard-foot">
          <div className="pcard-meta">
            <Stars value={p.rating} />
            <ColorDots colors={p.colors} />
          </div>
          <div className="pcard-price">
            {hasDiscount && <s className="pcard-price-old">{vnd(listPrice)}đ</s>}
            {vnd(price)} <span>đ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlashCard({ p, fav, onFav, onAdd, onBuy }) {
  const { buyNow } = useAppContext() || {};
  const handleBuy = onBuy || ((prod) => buyNow && buyNow(prod));

  const price = Number(p.price || 0);
  const oldPrice = Number(p.product_price || p.old || p.originalPrice || p.original_price || price || 0);
  const sold = Number(p.sold || 0);
  const stock = Number(p.stock || 1);
  const pct = Math.min(100, Math.round((sold / stock) * 100));
  const remaining = Math.max(0, stock - sold);

  return (
    <div className="pcard flash">
      <div className="pcard-media">
        <span className="flash-tag">-{discountPct(oldPrice, price)}%</span>
        <Link to={`/product/${p.product_id || p.productId || p.id}`} style={{ display: 'block', height: '100%' }}>
          <Img src={p.img} alt={p.name} label="ảnh sản phẩm" />
        </Link>
        <div className="pcard-tools">
          <FavBtn active={fav} onClick={() => onFav(p.product_id || p.productId || p.id)} />
          <button className="pcard-cart" onClick={() => onAdd(p)} aria-label="Thêm giỏ hàng" title="Thêm vào giỏ">
            <Icon name="cart" size={15} stroke={1.7} />
          </button>
          <button className="pcard-buy" onClick={() => handleBuy(p)} aria-label="Mua ngay" title="Mua ngay">
            ⚡
          </button>
        </div>
      </div>
      <div className="pcard-body">
        <div className="pcard-type">{p.type}</div>
        <Link to={`/product/${p.product_id || p.productId || p.id}`} className="pcard-name" style={{ color: 'inherit' }}>{p.name}</Link>
        <div className="pcard-foot">
          <Stars value={p.rating} />
          <div className="flash-prices">
            <span className="flash-old">{vnd(oldPrice)}đ</span>
            <span className="flash-now">{vnd(p.price)} <span>đ</span></span>
          </div>
        </div>
        <div className="flash-bar">
          <div className="flash-bar-fill" style={{ width: pct + "%" }}>
            <Icon name="leaf" size={11} stroke={0} fill="#fff" style={{ color: "#fff" }} />
          </div>
          <span className="flash-bar-label">
            Đã bán {sold}{remaining > 0 ? ` · còn ${remaining}` : " · hết suất"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CategoryPill({ c, onClick }) {
  const catName = typeof c === 'string' ? c : c.name;
  return (
    <a
      className="catpill"
      href="#showroom"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(catName);
        }
      }}
    >
      <div className="catpill-media"><Img src={c.img} alt={catName} label="ảnh" /></div>
      <span className="catpill-name">{catName}</span>
    </a>
  );
}

export function NewsCard({ n }) {
  // Ưu tiên slug cho URL thân thiện SEO; API vẫn nhận id nếu bài chưa có slug.
  const href = `/news/${n.slug || n.id}`;
  return (
    <article className="news-card">
      <Link to={href} style={{ display: "block", position: "relative" }}>
        <div className="news-media"><Img src={n.img} alt={n.title} label="ảnh tin tức" /></div>
        {n.category && (
          <span style={{
            position: "absolute", top: 12, left: 12,
            background: "rgba(255,255,255,.94)", color: "var(--green-ink)",
            padding: "4px 11px", borderRadius: 999,
            fontSize: 11, fontWeight: 700, letterSpacing: ".02em",
            boxShadow: "0 2px 8px rgba(0,0,0,.12)",
          }}>
            {n.category.name}
          </span>
        )}
      </Link>
      <div className="news-body">
        <Link to={href} style={{ textDecoration: "none" }}>
          <h4 className="news-title">{n.title}</h4>
        </Link>
        <div className="news-date">
          {n.date}{n.readingTime ? ` · ${n.readingTime} phút đọc` : ""}
        </div>
        <p className="news-ex">{n.excerpt}</p>
        <Link to={href} className="news-more">Đọc tiếp <Icon name="arrow" size={15} /></Link>
      </div>
    </article>
  );
}
