import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { Img, Icon, Stars, ColorDots, vnd, toast } from "../components/ui.jsx";

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { favs, toggleFav, addToCart } = useAppContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    api.getProductById(id)
      .then(data => {
        if (data) setProduct(data);
      })
      .catch(err => {
        toast(err.message || "Không tìm thấy sản phẩm");
        navigate("/shop");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div style={{ color: "var(--muted)" }}>Đang tải...</div>
      </div>
    );
  }

  if (!product) return null;

  const isFav = favs.has(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <section className="section" style={{ minHeight: "80vh", background: "var(--paper-2)", padding: "40px 0 80px" }}>
      <div className="wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
          
          {/* Left: Image */}
          <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ aspectRatio: "1/1", position: "relative" }}>
              <Img src={product.img} alt={product.name} />
              <button 
                onClick={() => toggleFav(product.id)}
                style={{ 
                  position: "absolute", top: 20, right: 20, width: 44, height: 44, 
                  borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center",
                  boxShadow: "var(--shadow-md)", color: isFav ? "#e6457a" : "var(--muted)"
                }}
              >
                <Icon name="heart" size={20} fill={isFav ? "#e6457a" : "none"} stroke={1.8} />
              </button>
            </div>
          </div>

          {/* Right: Info */}
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 12 }}>
              {product.category} • {product.type}
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: "var(--green-ink)", margin: "0 0 16px", lineHeight: 1.2 }}>
              {product.name}
            </h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--mint)", padding: "6px 12px", borderRadius: 999 }}>
                <Stars value={product.rating} size={15} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green-ink)" }}>{product.rating}</span>
              </div>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>Đã bán: <b>{product.sold}</b></span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>Tồn kho: <b>{product.stock}</b></span>
            </div>

            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--green)", marginBottom: 30 }}>
              {vnd(product.price)} <span style={{ fontSize: 18, textDecoration: "underline" }}>đ</span>
            </div>

            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 30, paddingBottom: 30, borderBottom: "1px solid var(--line)" }}>
              {product.description || "Chưa có mô tả cho sản phẩm này."}
            </p>

            <div style={{ marginBottom: 30 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Màu sắc</h4>
              <ColorDots colors={["#c9bfa6","#2f6b46","#1d2722"]} />
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid var(--line-2)", borderRadius: 12, padding: "4px" }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 40, height: 40, fontSize: 20, color: "var(--ink-2)" }}>-</button>
                <div style={{ width: 40, textAlign: "center", fontSize: 16, fontWeight: 600 }}>{quantity}</div>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} style={{ width: 40, height: 40, fontSize: 20, color: "var(--ink-2)" }}>+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="btn-pill" 
                style={{ flex: 1, justifyContent: "center", fontSize: 16, height: 50 }}
              >
                <Icon name="cart" size={18} /> Thêm vào giỏ
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--ink-2)" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center" }}><Icon name="truck" size={18} /></div>
                <div><b>Miễn phí giao hàng</b><br/><span style={{ color: "var(--muted)", fontSize: 12 }}>Cho đơn từ 5.000.000đ</span></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--ink-2)" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--mint)", color: "var(--green-ink)", display: "grid", placeItems: "center" }}><Icon name="shield" size={18} /></div>
                <div><b>Bảo hành 2 năm</b><br/><span style={{ color: "var(--muted)", fontSize: 12 }}>Chính hãng NAM QUAN</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
