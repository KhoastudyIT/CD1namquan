import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { ProductCard } from "../components/cards.jsx";

export function Favorites() {
  const { favs, toggleFav, addToCart } = useAppContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (favs.size === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Fetch all products (with large limit) to filter favorites locally
    api.getProducts({ limit: 100 })
      .then(res => {
        const all = Array.isArray(res) ? res : res.data || [];
        const favProducts = all.filter(p => favs.has(p.id));
        setProducts(favProducts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favs.size]); // only refetch if size changes drastically, or rely on local toggle

  return (
    <section className="section" style={{ minHeight: '80vh', padding: '40px 20px', background: 'var(--paper-2)' }}>
      <div className="wrap" style={{ maxWidth: 1000 }}>
        <h2 style={{ marginBottom: 24, fontSize: 24, color: "var(--green-ink)" }}>Sản phẩm yêu thích ({favs.size})</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'var(--muted)' }}>Đang tải...</div>
        ) : favs.size === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 12, border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💖</div>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Bạn chưa có sản phẩm yêu thích nào</p>
            <Link to="/shop" className="btn-pill">Khám phá cửa hàng</Link>
          </div>
        ) : (
          <div className="shop-grid">
            {products.filter(p => favs.has(p.id)).map(p => (
              <ProductCard
                key={p.id}
                p={p}
                fav={true}
                onFav={toggleFav}
                onAdd={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
