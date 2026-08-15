import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAppContext } from "../context.js";
import { vnd, Icon, toast } from "../components/ui.jsx";
import { AccountHeader } from "../components/AccountLayout.jsx";
import { ORDER_STATUS_LABEL, orderStatusLabel, orderStatusClass } from "../utils/orderStatus.js";

// Sinh thẳng từ ORDER_STATUS_LABEL thay vì chép tay: danh sách chép tay trước
// đây dùng key "shipping" trong khi trạng thái thật là "shipped" nên tab "Đang
// giao" luôn rỗng, và thiếu hẳn tab "confirmed".
const STATUS_TABS = [
  { key: "all", label: "Tất cả" },
  ...Object.entries(ORDER_STATUS_LABEL).map(([key, label]) => ({ key, label })),
];

export function Orders() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── State Bộ Lọc ──
  const [statusTab, setStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    api.getOrders()
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(err => toast(err.message || "Lỗi tải lịch sử đơn hàng"))
      .finally(() => setLoading(false));
  }, [navigate]);

  // ── Tính số lượng đơn theo từng trạng thái ──
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach(o => {
      const st = o.status || 'pending';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // ── Lọc và Sắp xếp danh sách ──
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Lọc theo Tab trạng thái
    if (statusTab !== "all") {
      result = result.filter(o => o.status === statusTab);
    }

    // Lọc theo Từ khóa tìm kiếm (Mã đơn, Tên sản phẩm)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => {
        const shortId = (o.id || "").split('-')[0].toLowerCase();
        const fullId = (o.id || "").toLowerCase();
        const itemNames = (o.items || []).map(i => (i.name || i.product_name || "").toLowerCase()).join(" ");
        const address = (o.shippingAddress || "").toLowerCase();
        return shortId.includes(q) || fullId.includes(q) || itemNames.includes(q) || address.includes(q);
      });
    }

    // Sắp xếp
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      const totalA = Number(a.total || 0);
      const totalB = Number(b.total || 0);

      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "price_desc") return totalB - totalA;
      if (sortBy === "price_asc") return totalA - totalB;
      return dateB - dateA; // newest default
    });

    return result;
  }, [orders, statusTab, searchQuery, sortBy]);

  if (!user) return null;

  return (
    <>
      <AccountHeader title="Lịch sử đơn hàng" desc="Theo dõi tình trạng và quản lý các đơn bạn đã đặt" />

      {/* ══════════ THANH BỘ LỌC ĐƠN HÀNG ══════════ */}
      <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* Tab Trạng thái đơn hàng */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
          {STATUS_TABS.map(tab => {
            const count = statusCounts[tab.key] || 0;
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  whiteSpace: "nowrap",
                  border: active ? "1.5px solid var(--green)" : "1px solid var(--line)",
                  background: active ? "var(--mint)" : "#fff",
                  color: active ? "var(--green-ink)" : "var(--ink-2)",
                  cursor: "pointer",
                  transition: ".18s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: active ? "var(--green)" : "var(--paper-2)",
                  color: active ? "#fff" : "var(--muted)",
                  fontWeight: 700
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Thanh tìm kiếm và sắp xếp */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          
          {/* Ô Tìm kiếm */}
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <input
              type="text"
              placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 36px 10px 14px",
                borderRadius: 10,
                border: "1px solid var(--line-2)",
                fontSize: 14,
                outline: "none",
                background: "#fff"
              }}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14 }}
              >
                ✕
              </button>
            ) : (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
                <Icon name="search" size={15} />
              </span>
            )}
          </div>

          {/* Ô Sắp xếp */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--line-2)",
              fontSize: 13.5,
              background: "#fff",
              color: "var(--ink-2)",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="newest">🆕 Ngày đặt: Mới → Cũ</option>
            <option value="oldest">📅 Ngày đặt: Cũ → Mới</option>
            <option value="price_desc">💎 Giá trị: Cao → Thấp</option>
            <option value="price_asc">💰 Giá trị: Thấp → Cao</option>
          </select>
        </div>
      </div>

      {/* ══════════ DANH SÁCH ĐƠN HÀNG ══════════ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, color: 'var(--muted)' }}>Đang tải đơn hàng...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#fff', borderRadius: 16, border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <h4 style={{ margin: "0 0 6px", fontSize: 16, color: "var(--green-ink)" }}>
            {orders.length === 0 ? "Bạn chưa có đơn hàng nào" : "Không tìm thấy đơn hàng phù hợp"}
          </h4>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            {orders.length === 0 ? "Hãy khám phá và chọn cho mình các mẫu nội thất ưa thích!" : "Thử đổi từ khóa tìm kiếm hoặc chọn tab trạng thái khác."}
          </p>
          {orders.length === 0 ? (
            <Link to="/shop" className="btn-pill">Khám phá cửa hàng</Link>
          ) : (
            <button
              onClick={() => { setStatusTab("all"); setSearchQuery(""); setSortBy("newest"); }}
              className="btn-pill ghost"
              style={{ borderColor: "var(--green)", color: "var(--green-ink)" }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Hiển thị <b>{filteredOrders.length}</b> / {orders.length} đơn hàng</span>
          </div>

          {filteredOrders.map(o => (
            <Link 
              to={`/account/orders/${o.id}`}
              key={o.id}
              className="order-card"
              style={{
                background: '#fff', padding: 20, borderRadius: 14,
                border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
                transition: '.2s', textDecoration: "none"
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--line)'}
            >
              <div className="order-card-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <b style={{ color: 'var(--ink)', fontSize: 15 }}>#{o.id.split('-')[0].toUpperCase()}</b>
                  <span className={"acc-status acc-status-" + orderStatusClass(o)}>
                    {orderStatusLabel(o)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Đặt ngày: {new Date(o.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {o.items?.length ?? 0} sản phẩm
                </div>
                {o.shippingAddress && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 6, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 450 }}>
                    📍 {o.shippingAddress}
                  </div>
                )}
              </div>
              <div className="order-card-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <b style={{ color: 'var(--green-ink)', fontSize: 16 }}>{vnd(o.total)}đ</b>
                <Icon name="arrowR" size={18} style={{ color: 'var(--muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
