import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { Icon, Img, vnd, toast } from "../components/ui.jsx";

export function Cart() {
  const { cart, fetchCart, user } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const updateQuantity = async (productId, newQ) => {
    if (newQ < 1) return;
    try {
      await api.updateCartItem(productId, newQ);
      fetchCart();
    } catch(err) {
      toast(err.message);
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.removeCartItem(productId);
      fetchCart();
      toast("Đã xóa khỏi giỏ hàng");
    } catch(err) {
      toast(err.message);
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      fetchCart();
      toast("Đã làm sạch giỏ hàng");
    } catch(err) {
      toast(err.message);
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (!user) return null;

  return (
    <section className="section" style={{ minHeight: '60vh', padding: '40px 20px', background: '#f9faf9' }}>
      <div className="wrap" style={{ maxWidth: 900 }}>
        <h2 style={{ marginBottom: 20 }}>Giỏ hàng của bạn</h2>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 12 }}>
            <p style={{ marginBottom: 20, color: 'var(--muted)' }}>Giỏ hàng trống</p>
            <Link to="/" className="btn-pill" style={{ background: 'var(--green)', color: '#fff', display: 'inline-flex' }}>Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 500px', background: '#fff', padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                <b>Sản phẩm</b>
                <button onClick={clearCart} style={{ color: 'var(--muted)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>Xóa tất cả</button>
              </div>
              {cart.map(item => (
                <div key={item.productId} style={{ display: 'flex', gap: 15, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden' }}>
                    <Img src={item.product.img} alt={item.product.name} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b style={{ fontSize: 15 }}>{item.product.name}</b>
                      <button onClick={() => removeItem(item.productId)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="close" size={16}/></button>
                    </div>
                    <div style={{ color: 'var(--green)', fontWeight: 600 }}>{vnd(item.product.price)}đ</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>-</button>
                      <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ flex: '1 1 300px', background: '#fff', padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
              <h3 style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>Tổng đơn hàng</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                <span>Tạm tính</span>
                <b>{vnd(total)}đ</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, color: 'var(--muted)' }}>
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
                <b style={{ fontSize: 18 }}>Tổng cộng</b>
                <b style={{ fontSize: 18, color: 'var(--green)' }}>{vnd(total)}đ</b>
              </div>
              <Link to="/checkout" className="btn-pill" style={{ width: '100%', justifyContent: 'center', background: 'var(--green)', color: '#fff', padding: 14 }}>Tiến hành thanh toán</Link>
              <div style={{ textAlign: 'center', marginTop: 15 }}>
                <Link to="/" style={{ color: 'var(--green)', fontSize: 14 }}>Tiếp tục mua sắm</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
