/* ============ NAM QUAN — cards ============ */
import { Img, Icon, Stars, ColorDots, vnd } from "./ui.jsx";

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

export function ProductCard({ p, fav, onFav, onAdd }) {
  return (
    <div className="pcard">
      <div className="pcard-media">
        <Img src={p.img} alt={p.name} label="ảnh sản phẩm" />
        <div className="pcard-tools">
          <FavBtn active={fav} onClick={() => onFav(p.id)} />
          <button className="pcard-cart" onClick={() => onAdd(p)} aria-label="Thêm giỏ hàng">
            <Icon name="cart" size={15} stroke={1.7} />
          </button>
        </div>
      </div>
      <div className="pcard-body">
        <div className="pcard-type">{p.type}</div>
        <div className="pcard-name">{p.name}</div>
        <div className="pcard-foot">
          <div className="pcard-meta">
            <Stars value={p.rating} />
            <ColorDots />
          </div>
          <div className="pcard-price">{vnd(p.price)} <span>đ</span></div>
        </div>
      </div>
    </div>
  );
}

export function FlashCard({ p, fav, onFav, onAdd }) {
  const pct = Math.min(100, Math.round((p.sold / p.stock) * 100));
  return (
    <div className="pcard flash">
      <div className="pcard-media">
        <span className="flash-tag">-{Math.round((1 - p.price / p.old) * 100)}%</span>
        <Img src={p.img} alt={p.name} label="ảnh sản phẩm" />
        <div className="pcard-tools">
          <FavBtn active={fav} onClick={() => onFav(p.id)} />
          <button className="pcard-cart" onClick={() => onAdd(p)} aria-label="Thêm giỏ hàng">
            <Icon name="cart" size={15} stroke={1.7} />
          </button>
        </div>
      </div>
      <div className="pcard-body">
        <div className="pcard-type">{p.type}</div>
        <div className="pcard-name">{p.name}</div>
        <div className="pcard-foot" style={{ alignItems: "flex-end" }}>
          <Stars value={p.rating} />
          <div className="flash-prices">
            <span className="flash-old">{vnd(p.old)}đ</span>
            <span className="flash-now">{vnd(p.price)} <span>đ</span></span>
          </div>
        </div>
        <div className="flash-bar">
          <div className="flash-bar-fill" style={{ width: pct + "%" }}>
            <Icon name="leaf" size={11} stroke={0} fill="#fff" style={{ color: "#fff" }} />
          </div>
          <span className="flash-bar-label">Đã bán {p.sold}</span>
        </div>
      </div>
    </div>
  );
}

export function CategoryPill({ c }) {
  return (
    <a className="catpill" href="#showroom">
      <div className="catpill-media"><Img src={c.img} alt={c.name} label="ảnh" /></div>
      <span className="catpill-name">{c.name}</span>
    </a>
  );
}

export function NewsCard({ n }) {
  return (
    <article className="news-card">
      <div className="news-media"><Img src={n.img} alt={n.title} label="ảnh tin tức" /></div>
      <div className="news-body">
        <h4 className="news-title">{n.title}</h4>
        <div className="news-date">{n.date}</div>
        <p className="news-ex">{n.excerpt}</p>
        <a className="news-more" href="#">Đọc tiếp <Icon name="arrow" size={15} /></a>
      </div>
    </article>
  );
}
