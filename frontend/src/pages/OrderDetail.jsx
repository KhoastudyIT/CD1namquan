import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { vnd, Img, toast, orderTotals, confirm } from "../components/ui.jsx";
import { ReturnRequest } from "../components/ReturnRequest.jsx";
import { orderStatusLabel, orderStatusClass } from "../utils/orderStatus.js";

export function OrderDetail() {
  const { id } = useParams();
  const { user, fetchCart } = useAppContext();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  // Yêu cầu trả/đổi của chính đơn này, lọc từ danh sách yêu cầu của khách.
  const [myReturn, setMyReturn] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reordering, setReordering] = useState(false);

  const handlePrintInvoice = async () => {
    setPrinting(true);
    try {
      await api.openInvoice(id);
    } catch (err) {
      toast(err.message);
    } finally {
      setPrinting(false);
    }
  };

  const handleCancelOrder = async () => {
    const ok = await confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?", "Xác nhận hủy đơn hàng");
    if (!ok) return;
    setCanceling(true);
    try {
      await api.cancelOrder(id);
      toast("Đã hủy đơn hàng thành công");
      const updated = await api.getOrderById(id);
      if (updated) setOrder(updated);
    } catch (err) {
      toast(err.message || "Hủy đơn hàng thất bại");
    } finally {
      setCanceling(false);
    }
  };

  const handleReorder = async () => {
    if (!order || !order.items || order.items.length === 0) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        const productId = item.productId || item.product_id;
        if (productId) {
          await api.addToCart(productId, item.quantity || 1);
        }
      }
      await fetchCart?.();
      toast("Đã thêm các sản phẩm vào giỏ hàng!");
      navigate("/account/cart");
    } catch (err) {
      toast(err.message || "Đặt lại đơn hàng thất bại");
    } finally {
      setReordering(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    api.getOrderById(id)
      .then(data => {
        if (data) setOrder(data);
      })
      .catch(err => {
        toast(err.message || "Không tìm thấy đơn hàng");
        navigate("/account/orders");
      })
      .finally(() => setLoading(false));

    // Lỗi ở đây không chặn việc xem đơn — chỉ là khối trả/đổi không hiện.
    api.getMyReturns()
      .then(list => setMyReturn((list ?? []).find(r => r.orderId === id) ?? null))
      .catch(() => {});
  }, [id, navigate]);

  if (!user) return null;

  if (loading) {
    return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><div style={{ color: "var(--muted)" }}>Đang tải...</div></div>;
  }

  if (!order) return null;

  const totals = orderTotals(order.items);

  return (
    <>
      <Link to="/account/orders" style={{ display: 'inline-block', marginBottom: 20, fontSize: 14, color: "var(--muted)" }}>← Trở lại danh sách đơn hàng</Link>

        <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--line-2)', paddingBottom: 20, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, margin: '0 0 8px', color: 'var(--ink)' }}>Chi tiết đơn hàng #{order.id.split('-')[0].toUpperCase()}</h2>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <button
                  type="button"
                  className="btn-pill ghost"
                  style={{ padding: '6px 14px', fontSize: 13, color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                  disabled={canceling}
                  onClick={handleCancelOrder}
                >
                  {canceling ? 'Đang hủy...' : '🚫 Hủy đơn hàng'}
                </button>
              )}
              {order.status === 'cancelled' && (
                <button
                  type="button"
                  className="btn-pill"
                  style={{ padding: '6px 16px', fontSize: 13, background: 'var(--green-ink)', color: '#fff' }}
                  disabled={reordering}
                  onClick={handleReorder}
                >
                  {reordering ? 'Đang thêm...' : '🔄 Đặt lại đơn hàng'}
                </button>
              )}
              <button
                type="button"
                className="btn-pill ghost"
                style={{ padding: '6px 14px', fontSize: 13 }}
                disabled={printing}
                onClick={handlePrintInvoice}
              >
                {printing ? 'Đang tạo...' : '🧾 In hóa đơn'}
              </button>
              <span className={"acc-status acc-status-" + orderStatusClass(order)} style={{ fontSize: 13, padding: '5px 12px' }}>
                {orderStatusLabel(order)}
                {order.shippingStatus === 'returned' && order.paymentStatus === 'refunded' ? ' · đã hoàn tiền' : ''}
              </span>
            </div>
          </div>

          <div className="order-detail-info">
            <div>
              <h3 style={{ fontSize: 15, margin: '0 0 10px', color: 'var(--ink-2)' }}>Thông tin giao hàng</h3>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                <b>{user.name}</b><br/>
                {order.shippingAddress}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, margin: '0 0 10px', color: 'var(--ink-2)' }}>Ghi chú</h3>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, background: '#f9f9f9', padding: 10, borderRadius: 8 }}>
                {order.note || "Không có ghi chú"}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, margin: '0 0 16px', borderBottom: '1px solid var(--line-2)', paddingBottom: 10 }}>Sản phẩm ({order.items.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <Img src={item.img} alt={item.name} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Link to={`/product/${item.productId}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{item.name}</Link>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    {item.quantity} x {vnd(item.price)}đ
                    {item.listPrice > item.price && (
                      <s style={{ marginLeft: 6 }}>{vnd(item.listPrice)}đ</s>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--green)', alignSelf: 'center' }}>
                  {vnd(item.price * item.quantity)}đ
                </div>
              </div>
            ))}
          </div>

          <div className="order-detail-summary">
            <div className="order-detail-summary-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Tạm tính{totals.hasDiscount ? " (giá gốc)" : ""}</span>
                <span>{vnd(totals.subtotal)}đ</span>
              </div>
              {totals.hasDiscount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: "var(--muted)" }}>Giảm giá</span>
                  <span style={{ color: "#e6457a", fontWeight: 600 }}>−{vnd(totals.discount)}đ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--line-2)', paddingTop: 15 }}>
                <b style={{ fontSize: 16 }}>Tổng thanh toán</b>
                <b style={{ fontSize: 20, color: 'var(--green-ink)' }}>{vnd(order.total)}đ</b>
              </div>
            </div>
          </div>

        </div>

        <ReturnRequest order={order} existing={myReturn} onCreated={setMyReturn} />
    </>
  );
}
