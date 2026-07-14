import { useState, useEffect } from "react";
import { api } from "../api.js";
import { vnd, Img, Icon, toast } from "../components/ui.jsx";

// ── Mini bar chart (pure CSS) ──────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = "var(--green)" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] / max) * 100);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              title={`${d[labelKey]}: ${d[valueKey]?.toLocaleString()}`}
              style={{
                width: "100%", borderRadius: "4px 4px 0 0",
                background: color,
                height: `${Math.max(pct, 3)}%`,
                transition: "height .5s cubic-bezier(.2,.7,.2,1)",
                opacity: 0.85,
              }}
            />
            <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" }}>
              {d[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Status color map ───────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:   "#f59a1c",
  confirmed: "#3b82f6",
  shipped:   "#8b5cf6",
  delivered: "var(--green)",
  cancelled: "#ef4444",
};

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // ── Chung ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Users tab ─────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [userPage, setUserPage] = useState(1);

  // ── Categories tab ────────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: "", img: "" });

  // ── Collections tab ───────────────────────────────────────────────
  const [allCollections, setAllCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showAddCollModal, setShowAddCollModal] = useState(false);
  const [showEditCollModal, setShowEditCollModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collFormData, setCollFormData] = useState({ name: "", img: "" });

  // ── News tab ──────────────────────────────────────────────────────
  const [allNews, setAllNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [showEditNewsModal, setShowEditNewsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [newsFormData, setNewsFormData] = useState({ title: "", img: "", excerpt: "", content: "", date: "" });

  // ── Products filter ───────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");

  // ── Modals ────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ── Product form ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", type: "", price: "", categoryId: "", img: "", stock: "", description: ""
  });

  // ─────────────── FETCH ───────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const productsData = await api.getProducts({ limit: 100 });
      setProducts(productsData.data || productsData || []);

      const ordersData = await api.getAllOrders();
      setOrders(ordersData || []);

      const statsData = await api.getStatsOverview();
      setStats(statsData);

      const catsData = await api.getCategories();
      setAllCategories(catsData || []);
    } catch (err) {
      console.error(err);
      toast("Lỗi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (overrides = {}) => {
    setUsersLoading(true);
    try {
      const params = {
        search: userSearch,
        role: userRole,
        status: userStatus,
        page: userPage,
        limit: 10,
        ...overrides,
      };
      Object.keys(params).forEach(k => params[k] === "" && delete params[k]);
      const res = await api.getUsers(params);
      setUsers(res.data || []);
      setUsersMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      toast("Lỗi tải danh sách người dùng: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const catsData = await api.getCategories();
      setAllCategories(catsData || []);
    } catch (err) {
      toast("Lỗi tải danh sách danh mục: " + err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchCollections = async () => {
    setCollectionsLoading(true);
    try {
      const collsData = await api.getCollections();
      setAllCollections(collsData || []);
    } catch (err) {
      toast("Lỗi tải danh sách bộ sưu tập: " + err.message);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const fetchNewsList = async () => {
    setNewsLoading(true);
    try {
      const newsData = await api.getNews();
      setAllNews(newsData || []);
    } catch (err) {
      toast("Lỗi tải danh sách tin tức: " + err.message);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === "categories") fetchCategories(); }, [activeTab]);
  useEffect(() => { if (activeTab === "collections") fetchCollections(); }, [activeTab]);
  useEffect(() => { if (activeTab === "news") fetchNewsList(); }, [activeTab]);

  // ─────────────── PRODUCT HANDLERS ────────────────────────────────
  const handleOpenAdd = () => {
    if (allCategories.length === 0) {
      toast("Create a category before adding a product");
      return;
    }
    setFormData({
      name: "", type: "", price: 1000000, categoryId: String(allCategories[0].id),
      img: "/images/placeholder.jpg", stock: 10, description: ""
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name, type: p.type, price: p.price, categoryId: p.category_id ? String(p.category_id) : "",
      img: p.img, stock: p.stock, description: p.description || ""
    });
    setShowEditModal(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price || !formData.stock || !formData.categoryId) { toast("Vui lòng điền đầy đủ thông tin bắt buộc"); return; }
    try {
      await api.createProduct({ ...formData, categoryId: Number(formData.categoryId), price: Number(formData.price), stock: Number(formData.stock) });
      toast("Thêm sản phẩm thành công!");
      setShowAddModal(false);
      fetchData();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.price || !formData.stock || !formData.categoryId) { toast("Vui lòng điền đầy đủ thông tin bắt buộc"); return; }
    try {
      await api.updateProduct(selectedProduct.id, { ...formData, categoryId: Number(formData.categoryId), price: Number(formData.price), stock: Number(formData.stock) });
      toast("Cập nhật sản phẩm thành công!");
      setShowEditModal(false);
      fetchData();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      try {
        await api.deleteProduct(id);
        toast("Xóa sản phẩm thành công!");
        fetchData();
      } catch (err) { toast("Lỗi xóa sản phẩm: " + err.message); }
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      toast("Đã cập nhật trạng thái đơn hàng!");
      fetchData();
    } catch (err) { toast("Lỗi cập nhật đơn hàng: " + err.message); }
  };

  // ─────────────── USER HANDLERS ───────────────────────────────────
  const handleUpdateUserRole = async (u) => {
    const newRole = u.role === "admin" ? "customer" : "admin";
    try {
      await api.updateUserRole(u.id, newRole);
      toast(`Đã đổi quyền thành ${newRole === "admin" ? "Admin" : "Khách hàng"}!`);
      fetchUsers({ page: userPage });
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateUserStatus = async (u) => {
    const newStatus = (u.status || "active") === "active" ? "suspended" : "active";
    try {
      await api.updateUserStatus(u.id, newStatus);
      toast(newStatus === "suspended" ? "Đã khóa tài khoản!" : "Đã mở khóa tài khoản!");
      fetchUsers({ page: userPage });
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  // ─────────────── CATEGORY HANDLERS ───────────────────────────────
  const handleOpenAddCat = () => {
    setCatFormData({ name: "", img: "/images/placeholder.jpg" });
    setShowAddCatModal(true);
  };

  const handleOpenEditCat = (c) => {
    setSelectedCategory(c);
    setCatFormData({ name: c.name, img: c.img });
    setShowEditCatModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name) { toast("Vui lòng điền tên danh mục"); return; }
    try {
      await api.createCategory(catFormData);
      toast("Thêm danh mục thành công!");
      setShowAddCatModal(false);
      fetchCategories();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name) { toast("Vui lòng điền tên danh mục"); return; }
    try {
      await api.updateCategory(selectedCategory.id, catFormData);
      toast("Cập nhật danh mục thành công!");
      setShowEditCatModal(false);
      fetchCategories();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        await api.deleteCategory(id);
        toast("Xóa danh mục thành công!");
        fetchCategories();
      } catch (err) { toast("Lỗi xóa danh mục: " + err.message); }
    }
  };

  // ─────────────── COLLECTION HANDLERS ─────────────────────────────
  const handleOpenAddColl = () => {
    setCollFormData({ name: "", img: "/images/placeholder.jpg" });
    setShowAddCollModal(true);
  };

  const handleOpenEditColl = (c) => {
    setSelectedCollection(c);
    setCollFormData({ name: c.name, img: c.img });
    setShowEditCollModal(true);
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!collFormData.name) { toast("Vui lòng điền tên bộ sưu tập"); return; }
    try {
      await api.createCollection(collFormData);
      toast("Thêm bộ sưu tập thành công!");
      setShowAddCollModal(false);
      fetchCollections();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    if (!collFormData.name) { toast("Vui lòng điền tên bộ sưu tập"); return; }
    try {
      await api.updateCollection(selectedCollection.id, collFormData);
      toast("Cập nhật bộ sưu tập thành công!");
      setShowEditCollModal(false);
      fetchCollections();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteCollection = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${name}"?`)) {
      try {
        await api.deleteCollection(id);
        toast("Xóa bộ sưu tập thành công!");
        fetchCollections();
      } catch (err) { toast("Lỗi xóa bộ sưu tập: " + err.message); }
    }
  };

  // ─────────────── NEWS HANDLERS ───────────────────────────────────
  const handleOpenAddNews = () => {
    setNewsFormData({ title: "", img: "/images/placeholder.jpg", excerpt: "", content: "", date: "" });
    setShowAddNewsModal(true);
  };

  const handleOpenEditNews = (n) => {
    setSelectedNews(n);
    setNewsFormData({ title: n.title, img: n.img, excerpt: n.excerpt, content: n.content, date: n.date || "" });
    setShowEditNewsModal(true);
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    if (!newsFormData.title || !newsFormData.excerpt || !newsFormData.content) {
      toast("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }
    try {
      await api.createNews(newsFormData);
      toast("Thêm bài viết thành công!");
      setShowAddNewsModal(false);
      fetchNewsList();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleUpdateNews = async (e) => {
    e.preventDefault();
    if (!newsFormData.title || !newsFormData.excerpt || !newsFormData.content) {
      toast("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }
    try {
      await api.updateNews(selectedNews.id, newsFormData);
      toast("Cập nhật bài viết thành công!");
      setShowEditNewsModal(false);
      fetchNewsList();
    } catch (err) { toast("Lỗi: " + err.message); }
  };

  const handleDeleteNews = async (id, title) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
      try {
        await api.deleteNews(id);
        toast("Xóa bài viết thành công!");
        fetchNewsList();
      } catch (err) { toast("Lỗi xóa bài viết: " + err.message); }
    }
  };

  // ─────────────── HELPERS ─────────────────────────────────────────
  const getStatusLabel = (s) => ({ pending: "Chờ xử lý", confirmed: "Đã xác nhận", shipped: "Đang giao", delivered: "Đã giao hàng", cancelled: "Đã hủy" }[s] || s);

  // Derived stats (fallback khi chưa load)
  const totalRevenue   = stats?.totalRevenue   ?? orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const totalOrders    = stats?.totalOrders    ?? orders.length;
  const totalProducts  = stats?.totalProducts  ?? products.length;
  const lowStockCount  = stats?.lowStockCount  ?? products.filter(p => p.stock < 10).length;
  const totalUsers     = stats?.totalUsers     ?? 0;
  const avgOrderValue  = stats?.avgOrderValue  ?? 0;
  const ordersByStatus = stats?.ordersByStatus ?? [];
  const revenueByDay   = stats?.revenueByDay   ?? [];
  const topProducts    = stats?.topProducts    ?? [];

  const displayCategories = allCategories;

  // Helpers to normalize product <-> category relations
  const getProductCategoryId = (p) => {
    if (p == null) return null;
    if (p.category_id != null) return Number(p.category_id);
    if (p.categoryId != null) return Number(p.categoryId);
    // fallback: if product has category as name, try to find matching category id
    if (typeof p.category === 'string') {
      const found = allCategories.find(c => c.name === p.category);
      return found ? Number(found.id) : null;
    }
    return null;
  };

  const getCategoryNameForProduct = (p) => {
    if (p == null) return "";
    if (p.category && typeof p.category === 'string') return p.category;
    const id = getProductCategoryId(p);
    if (id == null) return "";
    const c = allCategories.find(x => Number(x.id) === Number(id));
    return c ? c.name : "";
  };

  const lowStockProducts = products.filter(p => Number(p.stock) < 10);
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || "").toLowerCase().includes(productSearch.toLowerCase()) || (p.type || "").toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategory === "all" || getProductCategoryId(p) === Number(productCategory);
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
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--green-ink)" }}>HỆ THỐNG QUẢN TRỊ</h3>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Nam Quan Premium Shop</span>
        </div>

        {[
          { key: "overview",    icon: "leaf",  label: "Tổng quan" },
          { key: "products",    icon: "cart",  label: `Sản phẩm (${totalProducts})` },
          { key: "categories",  icon: "menu",  label: "Danh mục" },
          { key: "collections", icon: "pin",   label: "Bộ sưu tập" },
          { key: "news",        icon: "bell",  label: "Tin tức" },
          { key: "orders",      icon: "truck", label: `Đơn hàng (${totalOrders})` },
          { key: "users",       icon: "user",  label: "Người dùng" },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            className={`admin-sidebar-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon name={icon} size={16} fill={activeTab === key ? "#fff" : "none"} />
            <span>{label}</span>
          </button>
        ))}
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="admin-content">

        {/* ===== TAB 1: OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div>
            <div className="admin-sec-header">
              <h2>Trang tổng quan cửa hàng</h2>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>Dữ liệu từ API BE</span>
            </div>

            {/* 6 Stat Cards */}
            <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[
                { icon: "💰", label: "Doanh thu",              val: `${vnd(totalRevenue)} đ`,        accent: "var(--green)" },
                { icon: "📦", label: "Tổng đơn hàng",          val: totalOrders,                     accent: "var(--gold)" },
                { icon: "🛋️",  label: "Số sản phẩm",           val: totalProducts,                   accent: "var(--green-ink)" },
                { icon: "⚠️",  label: "Sắp hết hàng",          val: lowStockCount,                   accent: "#ff4d4f", valColor: lowStockCount > 0 ? "#ff4d4f" : undefined },
                { icon: "👥", label: "Khách hàng",             val: totalUsers,                      accent: "#3b82f6" },
                { icon: "📈", label: "Giá trị ĐH trung bình",  val: `${vnd(avgOrderValue)} đ`,       accent: "#8b5cf6" },
              ].map(({ icon, label, val, accent, valColor }) => (
                <div key={label} className="admin-stat-card" style={{ "--accent": accent }}>
                  <div className="admin-stat-icon">{icon}</div>
                  <div className="admin-stat-info">
                    <span className="admin-stat-label">{label}</span>
                    <span className="admin-stat-val" style={{ color: valColor }}>{val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: biểu đồ doanh thu + trạng thái đơn */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 20, marginBottom: 20 }}>
              <div className="admin-card">
                <h4 className="admin-card-title">📊 Doanh thu 7 ngày gần nhất</h4>
                {revenueByDay.length > 0
                  ? <BarChart data={revenueByDay} labelKey="date" valueKey="revenue" color="var(--green)" />
                  : <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu</p>
                }
              </div>
              <div className="admin-card">
                <h4 className="admin-card-title">🎯 Trạng thái đơn hàng</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ordersByStatus.map(item => {
                    const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
                    return (
                      <div key={item.status}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{getStatusLabel(item.status)}</span>
                          <span style={{ fontWeight: 700, color: STATUS_COLORS[item.status] }}>{item.count}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: STATUS_COLORS[item.status], transition: "width .6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                  {ordersByStatus.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Chưa có đơn hàng</p>}
                </div>
              </div>
            </div>

            {/* Row 3: top sản phẩm + đơn mới + tồn kho */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.8fr", gap: 20 }}>
              <div className="admin-card">
                <h4 className="admin-card-title">🏆 Top 5 bán chạy</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topProducts.map((p, i) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: i < 3 ? "var(--gold)" : "var(--muted)", minWidth: 18 }}>#{i + 1}</span>
                      <Img src={p.img} alt={p.name} className="admin-img-thumb" style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>Đã bán: <b style={{ color: "var(--green-ink)" }}>{p.sold}</b></div>
                      </div>
                    </div>
                  ))}
                  {topProducts.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Chưa có dữ liệu</p>}
                </div>
              </div>

              <div className="admin-card">
                <h4 className="admin-card-title">Đơn hàng mới nhất</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td style={{ fontWeight: 600, fontSize: 12, color: "var(--green-ink)" }}>#{o.id.substring(0, 6)}…</td>
                          <td style={{ fontSize: 12 }}>{o.customerName || "Khách lẻ"}</td>
                          <td style={{ fontWeight: 700, fontSize: 12 }}>{vnd(o.total)} đ</td>
                          <td><span className={`admin-badge ${o.status}`}>{getStatusLabel(o.status)}</span></td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>Chưa có đơn hàng nào</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-card">
                <h4 className="admin-card-title">Cảnh báo tồn kho</h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Sản phẩm</th><th>Còn</th></tr></thead>
                    <tbody>
                      {lowStockProducts.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 500, fontSize: 12 }}>{p.name}</td>
                          <td style={{ fontWeight: 700, color: p.stock === 0 ? "#ff4d4f" : "var(--orange-2)" }}>{p.stock}</td>
                        </tr>
                      ))}
                      {lowStockCount === 0 && <tr><td colSpan="2" style={{ textAlign: "center", padding: 16, color: "var(--green-ink)", fontWeight: 500, fontSize: 12 }}>✅ Đủ hàng</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 2: PRODUCTS ===== */}
        {activeTab === "products" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý sản phẩm</h2>
              <button className="btn-pill" onClick={handleOpenAdd}><span style={{ fontSize: 16 }}>+</span> Thêm sản phẩm</button>
            </div>

            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <input type="text" placeholder="Tìm kiếm sản phẩm theo tên hoặc loại..." className="admin-input" style={{ flex: 1, minWidth: 200 }} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                <select className="admin-select" style={{ width: 200 }} value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                  <option value="all">Tất cả danh mục</option>
                  {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th style={{ width: 60 }}>Ảnh</th><th>Tên sản phẩm</th><th>Loại</th><th>Danh mục</th><th>Đơn giá</th><th>Tồn kho</th><th>Đã bán</th><th style={{ width: 180 }}>Hành động</th></tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td><Img src={p.img} alt={p.name} className="admin-img-thumb" /></td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.type}</td>
                      <td style={{ color: "var(--muted)" }}>{getCategoryNameForProduct(p)}</td>
                      <td style={{ fontWeight: 700, color: "var(--green-ink)" }}>{vnd(p.price)} đ</td>
                      <td style={{ fontWeight: 600, color: p.stock < 10 ? "var(--orange-2)" : "inherit" }}>{p.stock}</td>
                      <td>{p.sold}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn-sm edit" onClick={() => handleOpenEdit(p)}>Sửa</button>
                          <button className="admin-btn-sm delete" onClick={() => handleDeleteProduct(p.id, p.name)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && <tr><td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Không tìm thấy sản phẩm nào phù hợp bộ lọc</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TAB 3: CATEGORIES ===== */}
        {activeTab === "categories" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý danh mục</h2>
              <button className="btn-pill" onClick={handleOpenAddCat}>
                <span style={{ fontSize: 16 }}>+</span> Thêm danh mục
              </button>
            </div>

            {categoriesLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th style={{ width: 100 }}>Ảnh đại diện</th>
                      <th>Tên danh mục</th>
                      <th style={{ width: 200 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCategories.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>#{c.id}</td>
                        <td>
                          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
                            <Img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn-sm edit" onClick={() => handleOpenEditCat(c)}>Sửa</button>
                            <button className="admin-btn-sm delete" onClick={() => handleDeleteCategory(c.id, c.name)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allCategories.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy danh mục nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4: COLLECTIONS ===== */}
        {activeTab === "collections" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý bộ sưu tập</h2>
              <button className="btn-pill" onClick={handleOpenAddColl}>
                <span style={{ fontSize: 16 }}>+</span> Thêm bộ sưu tập
              </button>
            </div>

            {collectionsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th style={{ width: 100 }}>Ảnh đại diện</th>
                      <th>Tên bộ sưu tập</th>
                      <th style={{ width: 200 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCollections.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>#{c.id}</td>
                        <td>
                          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
                            <Img src={c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn-sm edit" onClick={() => handleOpenEditColl(c)}>Sửa</button>
                            <button className="admin-btn-sm delete" onClick={() => handleDeleteCollection(c.id, c.name)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allCollections.length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy bộ sưu tập nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 5: NEWS ===== */}
        {activeTab === "news" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý tin tức</h2>
              <button className="btn-pill" onClick={handleOpenAddNews}>
                <span style={{ fontSize: 16 }}>+</span> Thêm bài viết
              </button>
            </div>

            {newsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th style={{ width: 100 }}>Ảnh bìa</th>
                      <th>Tiêu đề bài viết</th>
                      <th style={{ width: 120 }}>Ngày tạo</th>
                      <th style={{ width: 200 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allNews.map(n => (
                      <tr key={n.id}>
                        <td style={{ fontWeight: 600 }}>#{n.id}</td>
                        <td>
                          <div style={{ width: 56, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}>
                            <Img src={n.img} alt={n.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 13.5 }}>{n.title}</td>
                        <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{n.date}</td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn-sm edit" onClick={() => handleOpenEditNews(n)}>Sửa</button>
                            <button className="admin-btn-sm delete" onClick={() => handleDeleteNews(n.id, n.title)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allNews.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy bài viết nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 6: ORDERS ===== */}
        {activeTab === "orders" && (
          <div>
            <div className="admin-sec-header"><h2>Quản lý đơn hàng</h2></div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Mã đơn hàng</th><th>Ngày mua</th><th>Địa chỉ giao hàng</th><th>Tổng thanh toán</th><th>Trạng thái</th><th style={{ width: 220 }}>Xử lý trạng thái</th><th>Chi tiết</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: "var(--green-ink)", fontSize: 13 }}>#{o.id.substring(0, 8)}...</td>
                      <td style={{ color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ fontSize: 13, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.shippingAddress}</td>
                      <td style={{ fontWeight: 700 }}>{vnd(o.total)} đ</td>
                      <td><span className={`admin-badge ${o.status}`}>{getStatusLabel(o.status)}</span></td>
                      <td>
                        <select className="admin-select" style={{ padding: "6px 10px", fontSize: 13 }} value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}>
                          <option value="pending">Chờ xử lý</option>
                          <option value="confirmed">Xác nhận đơn</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao hàng</option>
                          <option value="cancelled">Hủy đơn hàng</option>
                        </select>
                      </td>
                      <td>
                        <button className="admin-btn-sm edit" style={{ background: "var(--mint-2)" }} onClick={() => { setSelectedOrder(o); setShowOrderModal(true); }}>Chi tiết</button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="7" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Chưa có đơn hàng nào</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TAB 7: USERS ===== */}
        {activeTab === "users" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý người dùng</h2>
              <span style={{ fontSize: 13, color: "var(--muted)", background: "var(--mint)", padding: "4px 12px", borderRadius: 999, fontWeight: 600 }}>
                {usersMeta.total} tài khoản
              </span>
            </div>

            {/* Filter bar */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: 200 }}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      setUserPage(1);
                      fetchUsers({ page: 1, search: e.target.value });
                    }
                  }}
                />
                <select
                  className="admin-select"
                  style={{ width: 150 }}
                  value={userRole}
                  onChange={e => {
                    const v = e.target.value;
                    setUserRole(v);
                    setUserPage(1);
                    fetchUsers({ page: 1, role: v });
                  }}
                >
                  <option value="">Tất cả quyền</option>
                  <option value="customer">Khách hàng</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  className="admin-select"
                  style={{ width: 160 }}
                  value={userStatus}
                  onChange={e => {
                    const v = e.target.value;
                    setUserStatus(v);
                    setUserPage(1);
                    fetchUsers({ page: 1, status: v });
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="suspended">Đã khóa</option>
                </select>
                <button
                  className="btn-pill"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => { setUserPage(1); fetchUsers({ page: 1 }); }}
                >
                  🔍 Tìm kiếm
                </button>
              </div>
            </div>

            {usersLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Quyền</th>
                        <th>Trạng thái</th>
                        <th>Ngày đăng ký</th>
                        <th style={{ width: 200 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.email}</td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700,
                              background: u.role === "admin" ? "#fef3c7" : "var(--mint)",
                              color: u.role === "admin" ? "#92400e" : "var(--green-ink)",
                            }}>
                              {u.role === "admin" ? "👑 Admin" : "👤 Khách hàng"}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700,
                              background: (u.status || "active") === "active" ? "#dcfce7" : "#fee2e2",
                              color: (u.status || "active") === "active" ? "var(--green-ink)" : "#ef4444",
                            }}>
                              {(u.status || "active") === "active" ? "✅ Hoạt động" : "🔒 Đã khóa"}
                            </span>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: 12 }}>
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-btn-sm edit"
                                style={{ fontSize: 11 }}
                                title={u.role === "admin" ? "Hạ xuống khách hàng" : "Nâng lên admin"}
                                onClick={() => handleUpdateUserRole(u)}
                              >
                                {u.role === "admin" ? "⬇ Hạ quyền" : "⬆ Admin"}
                              </button>
                              <button
                                className="admin-btn-sm"
                                style={{
                                  fontSize: 11,
                                  background: (u.status || "active") === "active" ? "#fee2e2" : "#dcfce7",
                                  color: (u.status || "active") === "active" ? "#ef4444" : "var(--green-ink)",
                                  border: "none", borderRadius: 7, padding: "5px 10px", fontWeight: 600, cursor: "pointer",
                                }}
                                title={(u.status || "active") === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                onClick={() => handleUpdateUserStatus(u)}
                              >
                                {(u.status || "active") === "active" ? "🔒 Khóa" : "🔓 Mở"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy người dùng nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {usersMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={userPage <= 1}
                      onClick={() => { const p = userPage - 1; setUserPage(p); fetchUsers({ page: p }); }}>‹</button>
                    {Array.from({ length: usersMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === userPage ? "active" : ""}`}
                        onClick={() => { setUserPage(p); fetchUsers({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={userPage >= usersMeta.totalPages}
                      onClick={() => { const p = userPage + 1; setUserPage(p); fetchUsers({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {userPage} / {usersMeta.totalPages} ({usersMeta.total} người dùng)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ===== MODAL: ADD PRODUCT ===== */}
      {showAddModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm sản phẩm mới</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input type="text" className="admin-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Loại sản phẩm *</label>
                  <input type="text" className="admin-input" required placeholder="Ghế Sofa, Bàn, Đèn..." value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục *</label>
                  <select className="admin-select" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                    <option value="" disabled>Select category</option>
                    {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đơn giá (đ) *</label>
                  <input type="number" className="admin-input" required min="1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho *</label>
                  <input type="number" className="admin-input" required min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" className="admin-input" value={formData.img} onChange={e => setFormData({ ...formData, img: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea className="admin-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT PRODUCT ===== */}
      {showEditModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa sản phẩm</h3>
            <form onSubmit={handleUpdateProduct}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input type="text" className="admin-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Loại sản phẩm *</label>
                  <input type="text" className="admin-input" required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục *</label>
                  <select className="admin-select" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                    <option value="" disabled>Select category</option>
                    {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đơn giá (đ) *</label>
                  <input type="number" className="admin-input" required min="1" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho *</label>
                  <input type="number" className="admin-input" required min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" className="admin-input" value={formData.img} onChange={e => setFormData({ ...formData, img: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea className="admin-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ORDER DETAILS ===== */}
      {showOrderModal && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setShowOrderModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowOrderModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chi tiết đơn hàng #{selectedOrder.id.substring(0, 8)}...</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 20, fontSize: 13.5, background: "var(--paper-2)", padding: 14, borderRadius: 10 }}>
              <div>
                <p style={{ margin: "0 0 6px" }}><b>Khách hàng:</b> {selectedOrder.customerName || "Khách mua lẻ"}{selectedOrder.customerEmail ? ` (${selectedOrder.customerEmail})` : ""}</p>
                <p style={{ margin: "0 0 6px" }}><b>Địa chỉ nhận hàng:</b> {selectedOrder.shippingAddress}</p>
                <p style={{ margin: 0 }}><b>Ghi chú đơn:</b> {selectedOrder.note || "Không có"}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 6px" }}><b>Ngày đặt:</b> {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                <p style={{ margin: "0 0 6px" }}><b>Trạng thái:</b> <span className={`admin-badge ${selectedOrder.status}`}>{getStatusLabel(selectedOrder.status)}</span></p>
                <p style={{ margin: 0 }}><b>Tổng thanh toán:</b> <span style={{ color: "var(--green-ink)", fontWeight: 700 }}>{vnd(selectedOrder.total)} đ</span></p>
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Sản phẩm đã mua</h4>
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ fontSize: 13 }}>
                <thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Đơn giá</th><th style={{ textAlign: "center" }}>SL</th><th style={{ textAlign: "right" }}>Tổng</th></tr></thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><Img src={item.img} alt={item.name} className="admin-img-thumb" style={{ width: 36, height: 36 }} /></td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{vnd(item.price)} đ</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--green-ink)" }}>{vnd(item.price * item.quantity)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-form-actions">
              <button className="btn-pill" onClick={() => setShowOrderModal(false)}>Đóng chi tiết</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD CATEGORY ===== */}
      {showAddCatModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddCatModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddCatModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm danh mục mới</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="admin-form-group">
                <label>Tên danh mục *</label>
                <input type="text" className="admin-input" required value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" className="admin-input" value={catFormData.img} onChange={e => setCatFormData({ ...catFormData, img: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddCatModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Lưu danh mục</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT CATEGORY ===== */}
      {showEditCatModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditCatModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditCatModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa danh mục</h3>
            <form onSubmit={handleUpdateCategory}>
              <div className="admin-form-group">
                <label>Tên danh mục *</label>
                <input type="text" className="admin-input" required value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" className="admin-input" value={catFormData.img} onChange={e => setCatFormData({ ...catFormData, img: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditCatModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD COLLECTION ===== */}
      {showAddCollModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddCollModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddCollModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm bộ sưu tập mới</h3>
            <form onSubmit={handleCreateCollection}>
              <div className="admin-form-group">
                <label>Tên bộ sưu tập *</label>
                <input type="text" className="admin-input" required value={collFormData.name} onChange={e => setCollFormData({ ...collFormData, name: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" className="admin-input" value={collFormData.img} onChange={e => setCollFormData({ ...collFormData, img: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddCollModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Lưu bộ sưu tập</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT COLLECTION ===== */}
      {showEditCollModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditCollModal(false)}>
          <div className="admin-modal-panel" onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditCollModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa bộ sưu tập</h3>
            <form onSubmit={handleUpdateCollection}>
              <div className="admin-form-group">
                <label>Tên bộ sưu tập *</label>
                <input type="text" className="admin-input" required value={collFormData.name} onChange={e => setCollFormData({ ...collFormData, name: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" className="admin-input" value={collFormData.img} onChange={e => setCollFormData({ ...collFormData, img: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditCollModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD NEWS ===== */}
      {showAddNewsModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddNewsModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddNewsModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm bài viết mới</h3>
            <form onSubmit={handleCreateNews}>
              <div className="admin-form-group">
                <label>Tiêu đề bài viết *</label>
                <input type="text" className="admin-input" required value={newsFormData.title} onChange={e => setNewsFormData({ ...newsFormData, title: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đường dẫn ảnh bìa</label>
                  <input type="text" className="admin-input" value={newsFormData.img} onChange={e => setNewsFormData({ ...newsFormData, img: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Ngày hiển thị (để trống sẽ lấy ngày hôm nay)</label>
                  <input type="text" className="admin-input" placeholder="VD: 11/03/2026" value={newsFormData.date} onChange={e => setNewsFormData({ ...newsFormData, date: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Mô tả ngắn (excerpt) *</label>
                <textarea className="admin-textarea" required style={{ height: 60 }} value={newsFormData.excerpt} onChange={e => setNewsFormData({ ...newsFormData, excerpt: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Nội dung chi tiết bài viết *</label>
                <textarea className="admin-textarea" required style={{ height: 160 }} value={newsFormData.content} onChange={e => setNewsFormData({ ...newsFormData, content: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddNewsModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Lưu bài viết</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT NEWS ===== */}
      {showEditNewsModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditNewsModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 650 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditNewsModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Chỉnh sửa bài viết</h3>
            <form onSubmit={handleUpdateNews}>
              <div className="admin-form-group">
                <label>Tiêu đề bài viết *</label>
                <input type="text" className="admin-input" required value={newsFormData.title} onChange={e => setNewsFormData({ ...newsFormData, title: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Đường dẫn ảnh bìa</label>
                  <input type="text" className="admin-input" value={newsFormData.img} onChange={e => setNewsFormData({ ...newsFormData, img: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Ngày hiển thị</label>
                  <input type="text" className="admin-input" placeholder="VD: 11/03/2026" value={newsFormData.date} onChange={e => setNewsFormData({ ...newsFormData, date: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Mô tả ngắn (excerpt) *</label>
                <textarea className="admin-textarea" required style={{ height: 60 }} value={newsFormData.excerpt} onChange={e => setNewsFormData({ ...newsFormData, excerpt: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label>Nội dung chi tiết bài viết *</label>
                <textarea className="admin-textarea" required style={{ height: 160 }} value={newsFormData.content} onChange={e => setNewsFormData({ ...newsFormData, content: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditNewsModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
