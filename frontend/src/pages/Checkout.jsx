import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { vnd, toast, Img, orderTotals } from "../components/ui.jsx";

export function Checkout() {
  const { cart, fetchCart, user } = useAppContext();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    } else if (cart.length === 0) {
      navigate('/account/cart');
    }
  }, [cart.length, navigate]);

  // totals.payable là số thực trả, đúng bằng cách backend chốt đơn.
  const totals = orderTotals(cart);
  const total = totals.payable;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast("Vui lòng nhập số điện thoại nhận hàng");
      return;
    }
    if (address.length < 10) {
      toast("Địa chỉ giao hàng quá ngắn");
      return;
    }

    setLoading(true);
    try {
      const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
      await api.createOrder({ shippingAddress: address, phone: phone.trim(), note, items });
      toast("🎉 Đặt hàng thành công!");
      fetchCart(); // This will clear the cart as backend deletes it
      navigate("/account/orders");
    } catch (err) {
      toast(err.message || "Lỗi khi đặt hàng");
    } finally {
      setLoading(false);
    }
  };

  if (!user || cart.length === 0) return null;

  return (
    <section className="section" style={{ minHeight: '80vh', padding: '40px 20px', background: 'var(--paper-2)' }}>
      <div className="wrap" style={{ maxWidth: 1000 }}>
        <h2 style={{ marginBottom: 24, fontSize: 24, color: "var(--green-ink)" }}>Thanh toán</h2>
        
        <div className="checkout-layout">
          
          {/* Form Checkout */}
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 18, marginBottom: 20 }}>Thông tin giao hàng</h3>
            <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Tên người nhận</label>
                <input type="text" value={user.name} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line-2)', background: '#f5f5f5', color: 'var(--muted)' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Email</label>
                <input type="email" value={user.email} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line-2)', background: '#f5f5f5', color: 'var(--muted)' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  Số điện thoại nhận hàng <span style={{ color: "red" }}>*</span>
                </label>
                <input 
                  type="tel" 
                  placeholder="Nhập số điện thoại nhận hàng (ví dụ: 0901 234 567)" 
                  required 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line-2)', background: '#fff' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Địa chỉ giao hàng chi tiết <span style={{ color: "red" }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" 
                  required 
                  minLength={10}
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line-2)', background: '#fff' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Ghi chú đơn hàng (Tùy chọn)</label>
                <textarea 
                  placeholder="Lưu ý về giao hàng, thời gian nhận..." 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--line-2)', background: '#fff', minHeight: 80, fontFamily: 'inherit' }} 
                />
              </div>

              <div style={{ marginTop: 10, paddingTop: 20, borderTop: '1px solid var(--line-2)' }}>
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Phương thức thanh toán</h3>
                <div style={{ padding: '14px 16px', border: '2px solid var(--green)', borderRadius: 10, background: 'var(--mint)', color: 'var(--green-ink)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" checked readOnly style={{ accentColor: 'var(--green)' }} />
                  Thanh toán khi nhận hàng (COD)
                </div>
              </div>

              <button type="submit" className="btn-pill" disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'var(--green)', color: '#fff', padding: 16, fontSize: 16, marginTop: 10 }}>
                {loading ? "Đang xử lý..." : `Xác nhận đặt hàng • ${vnd(total)}đ`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 18, marginBottom: 20 }}>Đơn hàng của bạn ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, maxHeight: 300, overflowY: 'auto', paddingRight: 10 }} className="scroll-x">
              {cart.map(item => (
                <div key={item.productId} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                    <Img src={item.product.img} alt={item.product.name} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{item.product.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      {item.quantity} x {vnd(item.product.price)}đ
                      {item.product.listPrice > item.product.price && (
                        <s style={{ marginLeft: 6 }}>{vnd(item.product.listPrice)}đ</s>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', alignSelf: 'center' }}>
                    {vnd(item.product.price * item.quantity)}đ
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Tạm tính{totals.hasDiscount ? " (giá gốc)" : ""}</span>
              <b>{vnd(totals.subtotal)}đ</b>
            </div>
            {totals.hasDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Giảm giá</span>
                <b style={{ color: "#e6457a" }}>−{vnd(totals.discount)}đ</b>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Phí vận chuyển</span>
              <span>Miễn phí</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--line-2)', paddingTop: 20 }}>
              <b style={{ fontSize: 18 }}>Tổng cộng</b>
              <b style={{ fontSize: 22, color: 'var(--green-ink)' }}>{vnd(total)}đ</b>
            </div>
            
            <Link to="/account/cart" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>
              ← Quay lại giỏ hàng
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
