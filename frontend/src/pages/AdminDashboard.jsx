import { useState, useEffect } from "react";
import { api } from "../api.js";
import { vnd, Img, Icon, toast } from "../components/ui.jsx";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states for Product Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    price: "",
    category: "Phòng khách",
    img: "",
    stock: "",
    description: ""
  });

  const categories = [
    "Phòng khách",
    "Phòng ngủ",
    "Decor",
    "Ngoại trời",
    "Văn phòng",
    "Trang trí"
  ];

  // Fetch all products and orders
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch 100 products to get all of them for management
      const productsData = await api.getProducts({ limit: 100 });
      setProducts(productsData.data || productsData || []);

      const ordersData = await api.getAllOrders();
      setOrders(ordersData || []);
    } catch (err) {
      console.error(err);
      toast("Lỗi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle open add modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      type: "Ghế Sofa",
      price: 1000000,
      category: "Phòng khách",
      img: "/images/placeholder.jpg",
      stock: 10,
      description: "Mô tả sản phẩm chất lượng cao."
    });
    setShowAddModal(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      type: p.type,
      price: p.price,
      category: p.category,
      img: p.img,
      stock: p.stock,
      description: p.description || ""
    });
    setShowEditModal(true);
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price || !formData.stock) {
      toast("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock)
      };
      await api.createProduct(payload);
      toast("Thêm sản phẩm thành công!");
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      toast("Lỗi: " + err.message);
    }
  };

  // Edit Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price || !formData.stock) {
      toast("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock)
      };
      await api.updateProduct(selectedProduct.id, payload);
      toast("Cập nhật sản phẩm thành công!");
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      toast("Lỗi: " + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      try {
        await api.deleteProduct(id);
        toast("Xóa sản phẩm thành công!");
        fetchData();
      } catch (err) {
        toast("Lỗi xóa sản phẩm: " + err.message);
      }
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      toast("Đã cập nhật trạng thái đơn hàng!");
      fetchData();
    } catch (err) {
      toast("Lỗi cập nhật đơn hàng: " + err.message);
    }
  };

  // Helper translations for status
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "confirmed": return "Đã xác nhận";
      case "shipped": return "Đang giao";
      case "delivered": return "Đã giao hàng";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  // Calculations for overview stats
  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10);
  const lowStockCount = lowStockProducts.length;

  // Filters for products management tab
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.type.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategory === "all" || p.category === productCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <div className="imgph" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
        <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--green-ink)" }}>HỆ THỐNG QUẢN TRỊ</h3>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Nam Quan Premium Shop</span>
        </div>
        
        <button 
          className={`admin-sidebar-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Icon name="leaf" size={16} fill={activeTab === "overview" ? "#fff" : "none"} />
          <span>Tổng quan</span>
        </button>
        
        <button 
          className={`admin-sidebar-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Icon name="cart" size={16} fill={activeTab === "products" ? "#fff" : "none"} />
          <span>Sản phẩm ({totalProducts})</span>
        </button>
        
        <button 
          className={`admin-sidebar-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <Icon name="truck" size={16} fill={activeTab === "orders" ? "#fff" : "none"} />
          <span>Đơn hàng ({totalOrders})</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div>
            <div className="admin-sec-header">
              <h2>Trang tổng quan cửa hàng</h2>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>Cập nhật realtime</span>
            </div>

            {/* Stat Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card" style={{ "--accent": "var(--green)" }}>
                <div className="admin-stat-icon">💰</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Doanh thu</span>
                  <span className="admin-stat-val">{vnd(totalRevenue)} đ</span>
                </div>
              </div>
              <div className="admin-stat-card" style={{ "--accent": "var(--gold)" }}>
                <div className="admin-stat-icon">📦</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Tổng đơn hàng</span>
                  <span className="admin-stat-val">{totalOrders}</span>
                </div>
              </div>
              <div className="admin-stat-card" style={{ "--accent": "var(--green-ink)" }}>
                <div className="admin-stat-icon">🛋️</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Số sản phẩm</span>
                  <span className="admin-stat-val">{totalProducts}</span>
                </div>
              </div>
              <div className="admin-stat-card" style={{ "--accent": "#ff4d4f" }}>
                <div className="admin-stat-icon">⚠️</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-label">Sắp hết hàng</span>
                  <span className="admin-stat-val" style={{ color: lowStockCount > 0 ? "#ff4d4f" : "var(--ink)" }}>{lowStockCount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
              {/* Recent Orders */}
              <div className="admin-card">
                <h4 className="admin-card-title">Đơn hàng mới nhất</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày tạo</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 600, fontSize: 13, color: "var(--green-ink)" }}>
                            #{o.id.substring(0, 8)}...
                          </td>
                          <td>Khách mua lẻ</td>
                          <td style={{ color: "var(--muted)" }}>
                            {new Date(o.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ fontWeight: 700 }}>{vnd(o.total)} đ</td>
                          <td>
                            <span className={`admin-badge ${o.status}`}>{getStatusLabel(o.status)}</span>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>
                            Chưa có đơn hàng nào trong hệ thống
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Products */}
              <div className="admin-card">
                <h4 className="admin-card-title">Cảnh báo tồn kho thấp</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            <Img src={p.img} alt={p.name} className="admin-img-thumb" style={{ width: 34, height: 34 }} />
                          </td>
                          <td style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</td>
                          <td style={{ fontWeight: 700, color: p.stock === 0 ? "#ff4d4f" : "var(--orange-2)" }}>
                            {p.stock}
                          </td>
                        </tr>
                      ))}
                      {lowStockCount === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: "center", padding: 24, color: "var(--green-ink)", fontWeight: 500 }}>
                            ✅ Tất cả sản phẩm đều đủ hàng
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRODUCTS ================= */}
        {activeTab === "products" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý sản phẩm</h2>
              <button className="btn-pill" onClick={handleOpenAdd}>
                <span style={{ fontSize: 16 }}>+</span> Thêm sản phẩm
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm theo tên hoặc loại..." 
                    className="admin-input" 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                <div style={{ width: 200 }}>
                  <select 
                    className="admin-select"
                    value={productCategory}
                    onChange={e => setProductCategory(e.target.value)}
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Loại</th>
                    <th>Danh mục</th>
                    <th>Đơn giá</th>
                    <th>Tồn kho</th>
                    <th>Đã bán</th>
                    <th style={{ width: 180 }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <Img src={p.img} alt={p.name} className="admin-img-thumb" />
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.type}</td>
                      <td style={{ color: "var(--muted)" }}>{p.category}</td>
                      <td style={{ fontWeight: 700, color: "var(--green-ink)" }}>{vnd(p.price)} đ</td>
                      <td style={{ fontWeight: 600, color: p.stock < 10 ? "var(--orange-2)" : "inherit" }}>
                        {p.stock}
                      </td>
                      <td>{p.sold}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn-sm edit" onClick={() => handleOpenEdit(p)}>
                            Sửa
                          </button>
                          <button className="admin-btn-sm delete" onClick={() => handleDeleteProduct(p.id, p.name)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                        Không tìm thấy sản phẩm nào phù hợp bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ORDERS ================= */}
        {activeTab === "orders" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý đơn hàng</h2>
            </div>

            {/* Orders Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Ngày mua</th>
                    <th>Địa chỉ giao hàng</th>
                    <th>Tổng thanh toán</th>
                    <th>Trạng thái</th>
                    <th style={{ width: 220 }}>Xử lý trạng thái</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: "var(--green-ink)", fontSize: 13 }}>
                        #{o.id.substring(0, 8)}...
                      </td>
                      <td style={{ color: "var(--muted)" }}>
                        {new Date(o.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: 13, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {o.shippingAddress}
                      </td>
                      <td style={{ fontWeight: 700 }}>{vnd(o.total)} đ</td>
                      <td>
                        <span className={`admin-badge ${o.status}`}>{getStatusLabel(o.status)}</span>
                      </td>
                      <td>
                        <select 
                          className="admin-select" 
                          style={{ padding: "6px 10px", fontSize: 13 }}
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="confirmed">Xác nhận đơn</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao hàng</option>
                          <option value="cancelled">Hủy đơn hàng</option>
                        </select>
                      </td>
                      <td>
                        <button 
                          className="admin-btn-sm edit" 
                          style={{ background: "var(--mint-2)" }}
                          onClick={() => {
                            setSelectedOrder(o);
                            setShowOrderModal(true);
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
                        Chưa có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: ADD PRODUCT ================= */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <h3 className="admin-modal-title">Thêm sản phẩm mới</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Loại sản phẩm *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    required 
                    placeholder="Ghế Sofa, Bàn, Đèn..." 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })} 
                  />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục *</label>
                  <select 
                    className="admin-select" 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đơn giá (đ) *</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    required 
                    min="1" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                  />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho *</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    required 
                    min="0" 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={formData.img} 
                  onChange={e => setFormData({ ...formData, img: e.target.value })} 
                />
              </div>

              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea 
                  className="admin-textarea" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-pill">
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PRODUCT ================= */}
      {showEditModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <h3 className="admin-modal-title">Chỉnh sửa sản phẩm</h3>
            <form onSubmit={handleUpdateProduct}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Loại sản phẩm *</label>
                  <input 
                    type="text" 
                    className="admin-input" 
                    required 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value })} 
                  />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục *</label>
                  <select 
                    className="admin-select" 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đơn giá (đ) *</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    required 
                    min="1" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                  />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho *</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    required 
                    min="0" 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  value={formData.img} 
                  onChange={e => setFormData({ ...formData, img: e.target.value })} 
                />
              </div>

              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea 
                  className="admin-textarea" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-pill">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ORDER DETAILS ================= */}
      {showOrderModal && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowOrderModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <h3 className="admin-modal-title">Chi tiết đơn hàng #{selectedOrder.id.substring(0, 8)}...</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 20, fontSize: 13.5, background: "var(--paper-2)", padding: 14, borderRadius: 10 }}>
              <div>
                <p style={{ margin: "0 0 6px" }}><b>Khách hàng:</b> Khách mua lẻ</p>
                <p style={{ margin: "0 0 6px" }}><b>Địa chỉ nhận hàng:</b> {selectedOrder.shippingAddress}</p>
                <p style={{ margin: 0 }}><b>Ghi chú đơn:</b> {selectedOrder.note || "Không có"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 6px" }}><b>Ngày đặt:</b> {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                <p style={{ margin: "0 0 6px" }}><b>Trạng thái:</b> <span className={`admin-badge ${selectedOrder.status}`} style={{ transform: "scale(0.9)", transformOrigin: "left" }}>{getStatusLabel(selectedOrder.status)}</span></p>
                <p style={{ margin: 0 }}><b>Tổng thanh toán:</b> <span style={{ color: "var(--green-ink)", fontWeight: 700 }}>{vnd(selectedOrder.total)} đ</span></p>
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Sản phẩm đã mua</h4>
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th style={{ textAlign: "center" }}>SL</th>
                    <th style={{ textAlign: "right" }}>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <Img src={item.img} alt={item.name} className="admin-img-thumb" style={{ width: 36, height: 36 }} />
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{vnd(item.price)} đ</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green-ink)" }}>
                        {vnd(item.price * item.quantity)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-form-actions">
              <button className="btn-pill" onClick={() => setShowOrderModal(false)}>
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
