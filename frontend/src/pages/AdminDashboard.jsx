import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { vnd, Img, Icon, toast, confirm } from "../components/ui.jsx";
import { ImageField } from "../components/ImageField.jsx";
import { ContentEditor } from "../components/ContentEditor.jsx";
import { AdminChat } from "../components/AdminChat.jsx";
import { useAppContext } from "../context.js";

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

// ── Tin tức ────────────────────────────────────────────────────────────
const NEWS_STATUS_META = {
  published: { label: "Đã đăng",   bg: "#dcfce7", color: "var(--green-ink)" },
  draft:     { label: "Bản nháp",  bg: "#fef3c7", color: "#92400e" },
  hidden:    { label: "Đã ẩn",     bg: "#e5e7eb", color: "#4b5563" },
};

const EMPTY_NEWS_FORM = {
  title: "", slug: "", img: "/images/news1.jpg", excerpt: "", content: "",
  categoryId: "", tags: "", status: "draft", featured: false, date: "",
  seoTitle: "", seoDescription: "", seoKeywords: "", ogImage: "",
};

// Xem trước slug sẽ được backend sinh ra khi admin để trống ô slug.
const slugify = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\u0111/g, "d").replace(/\u0110/g, "D")
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "bai-viet";

export function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppContext();

  // Đọc tab từ URL hash (#overview, #products, v.v.), fallback về 'overview'
  const VALID_TABS = ["overview", "products", "orders", "users", "categories", "collections", "news", "flash_sales", "chat"];
  const hashTab = location.hash.replace("#", "");
  const activeTab = VALID_TABS.includes(hashTab) ? hashTab : "overview";

  // Thay đổi tab → cập nhật URL hash (reload sẽ giữ đúng tab)
  const setActiveTab = useCallback((tab) => {
    navigate(`/admin#${tab}`, { replace: true });
  }, [navigate]);

  // ── Chung ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // Số tin khách chưa được trả lời — hiện ngay trên nhãn tab Chat ở sidebar.
  const [chatUnread, setChatUnread] = useState(0);

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
  const [newsMeta, setNewsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [newsCategories, setNewsCategories] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSearch, setNewsSearch] = useState("");
  const [newsStatus, setNewsStatus] = useState("");     // "" = tất cả
  const [newsCategory, setNewsCategory] = useState(""); // slug danh mục
  const [newsPage, setNewsPage] = useState(1);
  // Một modal dùng chung cho cả tạo mới và sửa — mode: "create" | "edit"
  const [newsModal, setNewsModal] = useState(null);
  const [newsSaving, setNewsSaving] = useState(false);
  const [newsSeoOpen, setNewsSeoOpen] = useState(false);
  const [newsFormData, setNewsFormData] = useState(EMPTY_NEWS_FORM);

  // Dùng chung cho mọi modal có ảnh — mỗi lúc chỉ mở được một modal.
  const [imageUploading, setImageUploading] = useState(false);

  // ── Flash Sales tab ────────────────────────────────────────────────
  const [flashSales, setFlashSales] = useState([]);
  const [flashSalesLoading, setFlashSalesLoading] = useState(false);
  const [showAddFlashModal, setShowAddFlashModal] = useState(false);
  const [showEditFlashModal, setShowEditFlashModal] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState(null);
  const [flashFormData, setFlashFormData] = useState({
    productId: "", price: "", originalPrice: "", discountPct: "", stock: "", sold: "", startsAt: "", endsAt: "", active: true
  });

  // ── Products filter ───────────────────────────────────────────────
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [productStock, setProductStock] = useState("all");     // all | in | low | out
  const [productSort, setProductSort] = useState("default");   // default | price-asc | price-desc | stock-asc | sold-desc

  // ── Mobile nav (menu hamburger) ───────────────────────────────────
  const [mobileNav, setMobileNav] = useState(false);

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

      const flashData = await api.getFlashSalesAdmin();
      setFlashSales(flashData || []);
    } catch (err) {
      console.error(err);
      toast("Lỗi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSales = async () => {
    setFlashSalesLoading(true);
    try {
      const data = await api.getFlashSalesAdmin();
      setFlashSales(data || []);
    } catch (err) {
      toast("Lỗi tải danh sách Flash Sale: " + err.message);
    } finally {
      setFlashSalesLoading(false);
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

  // overrides: cho phép gọi ngay với giá trị mới mà không chờ state cập nhật
  const fetchNewsList = async (overrides = {}) => {
    setNewsLoading(true);
    try {
      const params = {
        page:     overrides.page     ?? newsPage,
        limit:    newsMeta.limit,
        search:   overrides.search   ?? newsSearch,
        status:   overrides.status   ?? newsStatus,
        category: overrides.category ?? newsCategory,
      };
      Object.keys(params).forEach(k => { if (params[k] === "" || params[k] == null) delete params[k]; });

      const res = await api.getNewsAdmin(params);
      setAllNews(res.data || []);
      if (res.meta) setNewsMeta(res.meta);
    } catch (err) {
      toast("Lỗi tải danh sách tin tức: " + err.message);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchNewsCategories = async () => {
    try {
      setNewsCategories(await api.getNewsCategories() || []);
    } catch { /* bộ lọc danh mục không có thì tab vẫn dùng được */ }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === "categories") fetchCategories(); }, [activeTab]);
  useEffect(() => { if (activeTab === "collections") fetchCollections(); }, [activeTab]);
  useEffect(() => { if (activeTab === "news") { fetchNewsList(); fetchNewsCategories(); } }, [activeTab]);
  useEffect(() => { if (activeTab === "flash_sales") fetchFlashSales(); }, [activeTab]);

  // Badge chat chạy nền ở mọi tab để admin thấy khách nhắn dù đang ở trang khác.
  useEffect(() => {
    const poll = () => api.getChatUnreadCount()
      .then(data => setChatUnread(data?.total ?? 0))
      .catch(() => {});
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  // ─────────────── PRODUCT HANDLERS ────────────────────────────────
  const handleOpenAdd = () => {
    if (allCategories.length === 0) {
      toast("Vui lòng tạo danh mục trước khi thêm sản phẩm");
      return;
    }
    setFormData({
      name: "", type: "Ghế Sofa", price: 1000000, categoryId: String(allCategories[0].id),
      img: "/images/placeholder.jpg", stock: 10, description: "Mô tả sản phẩm chất lượng cao."
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
    if (await confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
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
    if (await confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
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
    if (await confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${name}"?`)) {
      try {
        await api.deleteCollection(id);
        toast("Xóa bộ sưu tập thành công!");
        fetchCollections();
      } catch (err) { toast("Lỗi xóa bộ sưu tập: " + err.message); }
    }
  };

  // ─────────────── NEWS HANDLERS ───────────────────────────────────
  const handleOpenAddNews = () => {
    setNewsFormData(EMPTY_NEWS_FORM);
    setNewsSeoOpen(false);
    setNewsModal({ mode: "create", id: null });
  };

  // Danh sách không kèm `content` (cho nhẹ) → phải tải chi tiết trước khi sửa.
  const handleOpenEditNews = async (n) => {
    setNewsSeoOpen(false);
    setNewsModal({ mode: "edit", id: n.id, loading: true });
    try {
      const a = await api.getNewsAdminById(n.id);
      setNewsFormData({
        title: a.title, slug: a.slug, img: a.img, excerpt: a.excerpt, content: a.content,
        categoryId: a.category?.id ? String(a.category.id) : "",
        tags: (a.tags || []).join(", "),
        status: a.status,
        featured: a.featured,
        date: a.publishedAt || "",
        seoTitle: a.seo?.title || "",
        seoDescription: a.seo?.description || "",
        seoKeywords: a.seo?.keywords || "",
        ogImage: a.seo?.ogImage || "",
      });
      setNewsModal({ mode: "edit", id: n.id, loading: false });
    } catch (err) {
      toast("Lỗi tải bài viết: " + err.message);
      setNewsModal(null);
    }
  };

  // Chỉ gửi các trường backend hiểu; chuỗi rỗng để backend tự xử lý (→ null).
  const buildNewsPayload = () => ({
    title:      newsFormData.title.trim(),
    img:        newsFormData.img.trim(),
    excerpt:    newsFormData.excerpt.trim(),
    content:    newsFormData.content.trim(),
    categoryId: newsFormData.categoryId ? Number(newsFormData.categoryId) : null,
    tags:       newsFormData.tags.split(",").map(t => t.trim()).filter(Boolean),
    status:     newsFormData.status,
    featured:   newsFormData.featured,
    date:       newsFormData.date || undefined,
    seoTitle:       newsFormData.seoTitle,
    seoDescription: newsFormData.seoDescription,
    seoKeywords:    newsFormData.seoKeywords,
    ogImage:        newsFormData.ogImage,
    // Slug để trống khi tạo mới = backend tự sinh từ tiêu đề.
    ...(newsFormData.slug.trim() ? { slug: newsFormData.slug.trim() } : {}),
  });

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    if (!newsFormData.title.trim() || !newsFormData.img.trim()
      || !newsFormData.excerpt.trim() || !newsFormData.content.trim()) {
      toast("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }
    setNewsSaving(true);
    try {
      const payload = buildNewsPayload();
      if (newsModal.mode === "create") {
        await api.createNews(payload);
        toast(payload.status === "published" ? "Đã đăng bài viết!" : "Đã lưu bản nháp!");
      } else {
        await api.updateNews(newsModal.id, payload);
        toast("Cập nhật bài viết thành công!");
      }
      setNewsModal(null);
      fetchNewsList();
      fetchNewsCategories(); // số bài theo danh mục đổi theo
    } catch (err) {
      toast("Lỗi: " + err.message);
    } finally {
      setNewsSaving(false);
    }
  };

  // Đăng / gỡ nhanh ngay trên bảng, không cần mở form
  const handleToggleNewsStatus = async (n) => {
    const next = n.status === "published" ? "hidden" : "published";
    try {
      const res = await api.updateNewsStatus(n.id, next);
      setAllNews(list => list.map(item => (item.id === n.id ? { ...item, status: res.status } : item)));
      toast(next === "published" ? "Đã đăng bài viết!" : "Đã gỡ bài viết khỏi trang tin tức!");
      fetchNewsCategories();
    } catch (err) { toast("Lỗi đổi trạng thái: " + err.message); }
  };

  const handleDeleteNews = async (id, title) => {
    if (await confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) {
      try {
        await api.deleteNews(id);
        toast("Xóa bài viết thành công!");
        // Xoá bài cuối của trang cuối → lùi về trang trước cho khỏi trống
        const page = allNews.length === 1 && newsPage > 1 ? newsPage - 1 : newsPage;
        setNewsPage(page);
        fetchNewsList({ page });
        fetchNewsCategories();
      } catch (err) { toast("Lỗi xóa bài viết: " + err.message); }
    }
  };

  // ─────────────── FLASH SALE HANDLERS ──────────────────────────────
  const handleOpenAddFlash = () => {
    if (products.length === 0) {
      toast("Vui lòng thêm sản phẩm trước khi tạo Flash Sale");
      return;
    }
    const defaultProduct = products[0];
    setFlashFormData({
      productId: String(defaultProduct.id),
      price: String(Math.round(defaultProduct.price * 0.8)),
      originalPrice: String(defaultProduct.price),
      discountPct: "20",
      stock: "50",
      sold: "0",
      startsAt: new Date().toISOString().slice(0, 16),
      endsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
      active: true
    });
    setShowAddFlashModal(true);
  };

  const handleOpenEditFlash = (fs) => {
    setSelectedFlash(fs);
    const discount = fs.original_price > 0 ? Math.round((1 - Number(fs.price) / Number(fs.original_price)) * 100) : 0;
    setFlashFormData({
      productId: String(fs.product_id),
      price: String(fs.price),
      originalPrice: String(fs.original_price),
      discountPct: String(discount),
      stock: String(fs.stock),
      sold: String(fs.sold),
      startsAt: fs.starts_at ? new Date(fs.starts_at).toISOString().slice(0, 16) : "",
      endsAt: fs.ends_at ? new Date(fs.ends_at).toISOString().slice(0, 16) : "",
      active: fs.active
    });
    setShowEditFlashModal(true);
  };

  const handleFlashProductChange = (prodId) => {
    const prod = products.find(p => String(p.id) === String(prodId));
    if (!prod) return;
    const orig = Number(prod.price || 0);
    const pct = Number(flashFormData.discountPct || 20);
    const sale = Math.round(orig * (1 - pct / 100));
    setFlashFormData(prev => ({
      ...prev,
      productId: String(prodId),
      originalPrice: String(orig),
      price: String(sale)
    }));
  };

  const handleFlashPriceChange = (val) => {
    const sale = Number(val || 0);
    const orig = Number(flashFormData.originalPrice || 0);
    let pct = 0;
    if (orig > 0) {
      pct = Math.round((1 - sale / orig) * 100);
    }
    setFlashFormData(prev => ({
      ...prev,
      price: String(val),
      discountPct: String(pct)
    }));
  };

  const handleFlashDiscountChange = (val) => {
    const pct = Number(val || 0);
    const orig = Number(flashFormData.originalPrice || 0);
    const sale = Math.round(orig * (1 - pct / 100));
    setFlashFormData(prev => ({
      ...prev,
      discountPct: String(val),
      price: String(sale)
    }));
  };

  const handleCreateFlash = async (e) => {
    e.preventDefault();
    try {
      await api.createFlashSale({
        productId: Number(flashFormData.productId),
        price: Number(flashFormData.price),
        originalPrice: Number(flashFormData.originalPrice),
        stock: Number(flashFormData.stock || 0),
        sold: Number(flashFormData.sold || 0),
        startsAt: flashFormData.startsAt ? new Date(flashFormData.startsAt).toISOString() : new Date().toISOString(),
        endsAt: flashFormData.endsAt ? new Date(flashFormData.endsAt).toISOString() : null,
        active: flashFormData.active
      });
      toast("Đã thêm chương trình Flash Sale");
      setShowAddFlashModal(false);
      fetchFlashSales();
    } catch (err) {
      toast("Lỗi tạo Flash Sale: " + err.message);
    }
  };

  const handleUpdateFlash = async (e) => {
    e.preventDefault();
    if (!selectedFlash) return;
    try {
      await api.updateFlashSale(selectedFlash.id, {
        productId: Number(flashFormData.productId),
        price: Number(flashFormData.price),
        originalPrice: Number(flashFormData.originalPrice),
        stock: Number(flashFormData.stock || 0),
        sold: Number(flashFormData.sold || 0),
        startsAt: flashFormData.startsAt ? new Date(flashFormData.startsAt).toISOString() : new Date().toISOString(),
        endsAt: flashFormData.endsAt ? new Date(flashFormData.endsAt).toISOString() : null,
        active: flashFormData.active
      });
      toast("Đã cập nhật chương trình Flash Sale");
      setShowEditFlashModal(false);
      fetchFlashSales();
    } catch (err) {
      toast("Lỗi cập nhật Flash Sale: " + err.message);
    }
  };

  const handleDeleteFlash = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chương trình Flash Sale này không?")) return;
    try {
      await api.deleteFlashSale(id);
      toast("Đã xóa chương trình Flash Sale");
      fetchFlashSales();
    } catch (err) {
      toast("Lỗi xóa Flash Sale: " + err.message);
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
  const ordersByStatus = Array.isArray(stats?.ordersByStatus) ? stats.ordersByStatus : [];
  const revenueByDay   = Array.isArray(stats?.revenueByDay)   ? stats.revenueByDay   : [];
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
  const filteredProducts = products
    .filter(p => {
      const q = productSearch.toLowerCase();
      const matchesSearch = (p.name || "").toLowerCase().includes(q) || (p.type || "").toLowerCase().includes(q);
      const matchesCategory = productCategory === "all" || getProductCategoryId(p) === Number(productCategory);
      const matchesStock =
        productStock === "all" ||
        (productStock === "in"  && Number(p.stock) >= 10) ||
        (productStock === "low" && Number(p.stock) > 0 && Number(p.stock) < 10) ||
        (productStock === "out" && Number(p.stock) === 0);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      switch (productSort) {
        case "price-asc":  return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "stock-asc":  return Number(a.stock) - Number(b.stock);
        case "sold-desc":  return (Number(b.sold) || 0) - (Number(a.sold) || 0);
        default:           return 0;
      }
    });

  const productFilterActive = productSearch || productCategory !== "all" || productStock !== "all" || productSort !== "default";
  const resetProductFilters = () => { setProductSearch(""); setProductCategory("all"); setProductStock("all"); setProductSort("default"); };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <div className="imgph" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
        <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  const NAV_ITEMS = [
    { key: "overview",    icon: "leaf",  label: "Tổng quan" },
    { key: "products",    icon: "cart",  label: `Sản phẩm (${totalProducts})` },
    { key: "categories",  icon: "menu",  label: "Danh mục" },
    { key: "collections", icon: "pin",   label: "Bộ sưu tập" },
    { key: "news",        icon: "bell",  label: "Tin tức" },
    { key: "flash_sales", icon: "fire",  label: `Flash Sale (${flashSales.length})` },
    { key: "orders",      icon: "truck", label: `Đơn hàng (${totalOrders})` },
    { key: "users",       icon: "user",  label: "Người dùng" },
    { key: "chat",        icon: "chat",  label: chatUnread > 0 ? `Chat (${chatUnread})` : "Chat" },
  ];
  const currentNavLabel = NAV_ITEMS.find(t => t.key === activeTab)?.label || "Quản trị";

  return (
    <div className="admin-layout">
      {/* ── Thanh bar mobile: hamburger + tên tab hiện tại ────────── */}
      <div className="admin-mobile-bar">
        <button className="admin-burger" onClick={() => setMobileNav(v => !v)} aria-label="Menu quản trị" aria-expanded={mobileNav}>
          <Icon name={mobileNav ? "close" : "menu"} size={20} />
        </button>
        <span className="admin-mobile-title">{currentNavLabel}</span>
      </div>

      {/* ── Sidebar (mobile: sổ xuống dưới thanh bar từ hamburger) ── */}
      <aside className={`admin-sidebar ${mobileNav ? "open" : ""}`}>
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--green-ink)" }}>HỆ THỐNG QUẢN TRỊ</h3>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Nam Quan Premium Shop</span>
        </div>

        {NAV_ITEMS.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`admin-sidebar-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => { setActiveTab(key); setMobileNav(false); }}
          >
            <Icon name={icon} size={16} fill={activeTab === key ? "#fff" : "none"} />
            <span>{label}</span>
          </button>
        ))}

        {/* Nút Thoát trên header bị ẩn ở mobile (.hdr .btn-pill{display:none}),
            và admin không có Drawer như khách — nên cần lối đăng xuất ở đây. */}
        <div className="admin-sidebar-foot">
          <span className="admin-sidebar-user">
            <Icon name="user" size={14} />
            {user?.name || "Quản trị viên"}
          </span>
          <button className="admin-logout-btn" onClick={logout}>
            <Icon name="arrow" size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
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
            <div className="admin-ov-stats">
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
            <div className="admin-ov-row2">
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
            <div className="admin-ov-row3">
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
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input type="text" placeholder="Tìm kiếm sản phẩm theo tên hoặc loại..." className="admin-input" style={{ flex: 1, minWidth: 200 }} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                <select className="admin-select" style={{ width: 180 }} value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                  <option value="all">Tất cả danh mục</option>
                  {displayCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="admin-select" style={{ width: 160 }} value={productStock} onChange={e => setProductStock(e.target.value)}>
                  <option value="all">Tất cả tồn kho</option>
                  <option value="in">Còn hàng (≥ 10)</option>
                  <option value="low">Sắp hết (1 – 9)</option>
                  <option value="out">Hết hàng (0)</option>
                </select>
                <select className="admin-select" style={{ width: 170 }} value={productSort} onChange={e => setProductSort(e.target.value)}>
                  <option value="default">Sắp xếp mặc định</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="stock-asc">Tồn kho ít nhất</option>
                  <option value="sold-desc">Bán chạy nhất</option>
                </select>
                {productFilterActive && (
                  <button className="btn-pill ghost" style={{ padding: "9px 16px", fontSize: 13 }} onClick={resetProductFilters}>✕ Xóa lọc</button>
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
                Hiển thị <b style={{ color: "var(--green-ink)" }}>{filteredProducts.length}</b> / {products.length} sản phẩm
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
              <h2>Tin tức & bài viết</h2>
              <div className="admin-sec-actions">
                {/* Lượt xem tăng khi khách đọc bài, nhưng bảng chỉ nạp lại lúc
                    mở tab. Nút này để xem số mới mà không phải F5 cả trang. */}
                <button
                  className="btn-pill ghost"
                  onClick={() => fetchNewsList()}
                  disabled={newsLoading}
                  title="Tải lại lượt xem và trạng thái mới nhất"
                >
                  <Icon name="refresh" size={15} />
                  {newsLoading ? "Đang tải…" : "Làm mới"}
                </button>
                <button className="btn-pill" onClick={handleOpenAddNews}>
                  <span style={{ fontSize: 16 }}>+</span> Viết bài mới
                </button>
              </div>
            </div>

            {/* Lọc nhanh theo trạng thái */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                { value: "",          label: "Tất cả" },
                { value: "published", label: "Đã đăng" },
                { value: "draft",     label: "Bản nháp" },
                { value: "hidden",    label: "Đã ẩn" },
              ].map(t => (
                <button
                  key={t.value || "all"}
                  onClick={() => { setNewsStatus(t.value); setNewsPage(1); fetchNewsList({ status: t.value, page: 1 }); }}
                  style={{
                    padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: `1.5px solid ${newsStatus === t.value ? "var(--green)" : "var(--line)"}`,
                    background: newsStatus === t.value ? "var(--green)" : "#fff",
                    color: newsStatus === t.value ? "#fff" : "var(--ink-2)",
                    transition: ".18s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tìm kiếm + lọc danh mục */}
            <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề hoặc mô tả ngắn (không cần gõ dấu)..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: 220 }}
                  value={newsSearch}
                  onChange={e => setNewsSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setNewsPage(1); fetchNewsList({ page: 1, search: e.target.value }); }
                  }}
                />
                <select
                  className="admin-select"
                  style={{ width: 200 }}
                  value={newsCategory}
                  onChange={e => {
                    const v = e.target.value;
                    setNewsCategory(v); setNewsPage(1);
                    fetchNewsList({ page: 1, category: v });
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  {newsCategories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name} ({c.articleCount})</option>
                  ))}
                </select>
                <button
                  className="btn-pill"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={() => { setNewsPage(1); fetchNewsList({ page: 1 }); }}
                >
                  🔍 Tìm kiếm
                </button>
              </div>
            </div>

            {newsLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-news-table">
                    <thead>
                      <tr>
                        <th style={{ width: 90 }}>Ảnh bìa</th>
                        <th>Bài viết</th>
                        <th style={{ width: 150 }}>Danh mục</th>
                        <th style={{ width: 110 }}>Trạng thái</th>
                        <th style={{ width: 90 }}>Lượt xem</th>
                        <th style={{ width: 110 }}>Ngày đăng</th>
                        <th style={{ width: 210 }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNews.map(n => {
                        const meta = NEWS_STATUS_META[n.status] || NEWS_STATUS_META.draft;
                        return (
                          <tr key={n.id}>
                            <td>
                              <div style={{ width: 62, height: 44, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}>
                                <Img src={n.img} alt={n.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13.5, lineHeight: 1.4 }}>
                                {n.featured && <span title="Bài nổi bật">⭐</span>}
                                {n.title}
                              </div>
                              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                                /{n.slug} · {n.readingTime} phút đọc
                              </div>
                              {/* Mobile ẩn 3 cột danh mục/lượt xem/ngày để cột
                                  tiêu đề rộng ra — gộp lại đây cho khỏi mất. */}
                              <div className="admin-news-meta">
                                {n.category?.name || "Chưa phân loại"} · {n.date} · {n.views?.toLocaleString("vi-VN")} lượt xem
                              </div>
                            </td>
                            <td>
                              {n.category ? (
                                <span style={{
                                  display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                  fontSize: 11.5, fontWeight: 700,
                                  background: "var(--mint)", color: "var(--green-ink)",
                                }}>
                                  {n.category.name}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                fontSize: 12, fontWeight: 700, background: meta.bg, color: meta.color,
                              }}>
                                {meta.label}
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "var(--muted)" }}>{n.views?.toLocaleString("vi-VN")}</td>
                            <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{n.date}</td>
                            <td>
                              <div className="admin-actions">
                                <button className="admin-btn-sm edit" onClick={() => handleOpenEditNews(n)}>Sửa</button>
                                <button
                                  className="admin-btn-sm"
                                  style={{
                                    fontSize: 11,
                                    background: n.status === "published" ? "#e5e7eb" : "#dcfce7",
                                    color: n.status === "published" ? "#4b5563" : "var(--green-ink)",
                                    border: "none", borderRadius: 7, padding: "5px 10px", fontWeight: 600, cursor: "pointer",
                                  }}
                                  title={n.status === "published" ? "Gỡ khỏi trang tin tức" : "Đăng lên trang tin tức"}
                                  onClick={() => handleToggleNewsStatus(n)}
                                >
                                  {n.status === "published" ? "Gỡ bài" : "Đăng bài"}
                                </button>
                                <button className="admin-btn-sm delete" onClick={() => handleDeleteNews(n.id, n.title)}>Xóa</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {allNews.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Không tìm thấy bài viết nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang */}
                {newsMeta.totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
                    <button className="page-btn" disabled={newsPage <= 1}
                      onClick={() => { const p = newsPage - 1; setNewsPage(p); fetchNewsList({ page: p }); }}>‹</button>
                    {Array.from({ length: newsMeta.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`page-btn ${p === newsPage ? "active" : ""}`}
                        onClick={() => { setNewsPage(p); fetchNewsList({ page: p }); }}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={newsPage >= newsMeta.totalPages}
                      onClick={() => { const p = newsPage + 1; setNewsPage(p); fetchNewsList({ page: p }); }}>›</button>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>
                      Trang {newsPage} / {newsMeta.totalPages} ({newsMeta.total} bài viết)
                    </span>
                  </div>
                )}
              </>
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

        {/* ===== TAB 8: FLASH SALES ===== */}
        {activeTab === "flash_sales" && (
          <div>
            <div className="admin-sec-header">
              <h2>Quản lý Flash Sale</h2>
              <button className="btn-pill" onClick={handleOpenAddFlash}>🔥 Thêm Flash Sale</button>
            </div>

            {flashSalesLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải...</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ảnh</th>
                      <th>Sản phẩm</th>
                      <th>Giá gốc</th>
                      <th>Giá sale</th>
                      <th>Giảm giá</th>
                      <th>Kho sale</th>
                      <th>Đã bán</th>
                      <th>Thời gian sale</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flashSales.map(fs => {
                      const discount = fs.original_price > 0 ? Math.round((1 - fs.price / fs.original_price) * 100) : 0;
                      const startStr = fs.starts_at ? new Date(fs.starts_at).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' }) : "N/A";
                      const endStr = fs.ends_at ? new Date(fs.ends_at).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' }) : "Không giới hạn";
                      return (
                        <tr key={fs.id}>
                          <td>
                            <img src={fs.product_img || "/images/placeholder.jpg"} alt={fs.product_name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />
                          </td>
                          <td style={{ fontWeight: 600 }}>{fs.product_name}</td>
                          <td style={{ color: "var(--muted)", textDecoration: "line-through" }}>{vnd(fs.original_price)} đ</td>
                          <td style={{ color: "var(--red)", fontWeight: 700 }}>{vnd(fs.price)} đ</td>
                          <td>
                            <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              -{discount}%
                            </span>
                          </td>
                          <td>{fs.stock}</td>
                          <td>{fs.sold}</td>
                          <td style={{ fontSize: 12, color: "var(--muted)" }}>
                            <div>Bắt đầu: {startStr}</div>
                            <div>Kết thúc: {endStr}</div>
                          </td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "3px 10px", borderRadius: 999,
                              fontSize: 12, fontWeight: 700,
                              background: fs.active ? "#dcfce7" : "#fee2e2",
                              color: fs.active ? "var(--green-ink)" : "#ef4444",
                            }}>
                              {fs.active ? "✅ Hoạt động" : "❌ Tạm ngưng"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button className="admin-btn-sm edit" onClick={() => handleOpenEditFlash(fs)}>Sửa</button>
                              <button className="admin-btn-sm delete" onClick={() => handleDeleteFlash(fs.id)}>Xóa</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {flashSales.length === 0 && (
                      <tr><td colSpan="10" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Chưa cấu hình chương trình Flash Sale nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 9: CHAT ===== */}
        {activeTab === "chat" && <AdminChat />}
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
              <ImageField
                label="Ảnh sản phẩm"
                type="products"
                value={formData.img}
                onChange={img => setFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea className="admin-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Lưu sản phẩm</button>
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
              <ImageField
                label="Ảnh sản phẩm"
                type="products"
                value={formData.img}
                onChange={img => setFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-group">
                <label>Mô tả chi tiết</label>
                <textarea className="admin-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Cập nhật</button>
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
              <ImageField
                label="Ảnh danh mục"
                type="categories"
                value={catFormData.img}
                onChange={img => setCatFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddCatModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Lưu danh mục</button>
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
              <ImageField
                label="Ảnh danh mục"
                type="categories"
                value={catFormData.img}
                onChange={img => setCatFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditCatModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Cập nhật</button>
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
              <ImageField
                label="Ảnh bộ sưu tập"
                type="collections"
                value={collFormData.img}
                onChange={img => setCollFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddCollModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Lưu bộ sưu tập</button>
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
              <ImageField
                label="Ảnh bộ sưu tập"
                type="collections"
                value={collFormData.img}
                onChange={img => setCollFormData(f => ({ ...f, img }))}
                onUploadingChange={setImageUploading}
              />
              <div className="admin-form-actions">
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditCollModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill" disabled={imageUploading}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: SOẠN / SỬA BÀI VIẾT ===== */}
      {newsModal && (
        <div className="admin-modal-backdrop" onClick={() => !newsSaving && setNewsModal(null)}>
          {/* Rộng hơn các modal khác: form này có thanh công cụ nhiều nút và
              khung soạn nội dung dài, chật quá thì toolbar bị xuống dòng. */}
          <div className="admin-modal-panel" style={{ maxWidth: 1080, width: "94%" }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setNewsModal(null)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">
              {newsModal.mode === "create" ? "Viết bài mới" : "Chỉnh sửa bài viết"}
            </h3>

            {newsModal.loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Đang tải nội dung bài viết...</div>
            ) : (
              <form onSubmit={handleSubmitNews}>
                {/* ── Nội dung ───────────────────────────────────────── */}
                <div className="admin-form-group">
                  <label>Tiêu đề bài viết *</label>
                  <input
                    type="text" className="admin-input" required maxLength={500}
                    value={newsFormData.title}
                    onChange={e => setNewsFormData({ ...newsFormData, title: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Đường dẫn (slug)</label>
                  <input
                    type="text" className="admin-input"
                    placeholder={newsModal.mode === "create" ? "Để trống sẽ tự sinh từ tiêu đề" : ""}
                    value={newsFormData.slug}
                    onChange={e => setNewsFormData({ ...newsFormData, slug: e.target.value })}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    /news/{newsFormData.slug.trim() || (newsFormData.title ? slugify(newsFormData.title) : "…")}
                    {newsModal.mode === "edit" && " · đổi slug sẽ làm hỏng liên kết cũ đã chia sẻ"}
                  </small>
                </div>

                <ImageField
                  label="Ảnh bìa"
                  required
                  type="news"
                  value={newsFormData.img}
                  onChange={img => setNewsFormData(f => ({ ...f, img }))}
                  onUploadingChange={setImageUploading}
                />

                <div className="admin-form-group">
                  <label>Ngày đăng</label>
                  <input
                    type="date" className="admin-input" style={{ maxWidth: 260 }}
                    value={newsFormData.date}
                    onChange={e => setNewsFormData({ ...newsFormData, date: e.target.value })}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>Để trống = ngày hôm nay</small>
                </div>

                <div className="admin-form-group">
                  <label>
                    Mô tả ngắn *
                    <span style={{ float: "right", fontSize: 11.5, fontWeight: 500, color: newsFormData.excerpt.length > 500 ? "#ef4444" : "var(--muted)" }}>
                      {newsFormData.excerpt.length}/500
                    </span>
                  </label>
                  <textarea
                    className="admin-textarea" required style={{ height: 66 }} maxLength={500}
                    placeholder="Đoạn giới thiệu hiển thị ở card tin tức và kết quả tìm kiếm"
                    value={newsFormData.excerpt}
                    onChange={e => setNewsFormData({ ...newsFormData, excerpt: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Nội dung bài viết *</label>
                  <ContentEditor
                    value={newsFormData.content}
                    onChange={content => setNewsFormData(f => ({ ...f, content }))}
                    imageType="news"
                    height={280}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    Bôi đen chữ rồi bấm nút trên thanh công cụ. Dòng trống để ngăn đoạn.
                    Thẻ HTML sẽ bị gỡ khi lưu.
                  </small>
                </div>

                {/* ── Phân loại & hiển thị ───────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="admin-form-group">
                    <label>Danh mục</label>
                    <select
                      className="admin-select"
                      value={newsFormData.categoryId}
                      onChange={e => setNewsFormData({ ...newsFormData, categoryId: e.target.value })}
                    >
                      <option value="">— Chưa phân loại —</option>
                      {newsCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Trạng thái</label>
                    <select
                      className="admin-select"
                      value={newsFormData.status}
                      onChange={e => setNewsFormData({ ...newsFormData, status: e.target.value })}
                    >
                      <option value="draft">Bản nháp — chưa hiển thị</option>
                      <option value="published">Đã đăng — hiện trên website</option>
                      <option value="hidden">Đã ẩn — gỡ khỏi website</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Thẻ (tag)</label>
                  <input
                    type="text" className="admin-input"
                    placeholder="Ngăn cách bằng dấu phẩy. VD: sofa, phòng khách, mẹo bài trí"
                    value={newsFormData.tags}
                    onChange={e => setNewsFormData({ ...newsFormData, tags: e.target.value })}
                  />
                  <small style={{ fontSize: 11.5, color: "var(--muted)" }}>Tối đa 10 thẻ</small>
                </div>

                <div className="admin-form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newsFormData.featured}
                      onChange={e => setNewsFormData({ ...newsFormData, featured: e.target.checked })}
                    />
                    ⭐ Bài nổi bật — được ưu tiên hiển thị trên trang chủ
                  </label>
                </div>

                {/* ── SEO (thu gọn) ──────────────────────────────────── */}
                <div style={{ border: "1px solid var(--line)", borderRadius: 10, marginBottom: 18, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setNewsSeoOpen(o => !o)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 14px", background: "var(--mint)", border: "none", cursor: "pointer",
                      fontSize: 13.5, fontWeight: 700, color: "var(--green-ink)",
                    }}
                  >
                    <span>Tối ưu SEO {newsSeoOpen ? "" : "(tùy chọn)"}</span>
                    <span>{newsSeoOpen ? "▲" : "▼"}</span>
                  </button>

                  {newsSeoOpen && (
                    <div style={{ padding: "16px 14px 2px" }}>
                      <div className="admin-form-group">
                        <label>
                          Tiêu đề SEO
                          <span style={{ float: "right", fontSize: 11.5, fontWeight: 500, color: newsFormData.seoTitle.length > 60 ? "#f59a1c" : "var(--muted)" }}>
                            {newsFormData.seoTitle.length}/60 khuyến nghị
                          </span>
                        </label>
                        <input
                          type="text" className="admin-input" maxLength={255}
                          placeholder="Để trống sẽ dùng tiêu đề bài viết"
                          value={newsFormData.seoTitle}
                          onChange={e => setNewsFormData({ ...newsFormData, seoTitle: e.target.value })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>
                          Mô tả SEO
                          <span style={{ float: "right", fontSize: 11.5, fontWeight: 500, color: newsFormData.seoDescription.length > 160 ? "#f59a1c" : "var(--muted)" }}>
                            {newsFormData.seoDescription.length}/160 khuyến nghị
                          </span>
                        </label>
                        <textarea
                          className="admin-textarea" style={{ height: 60 }} maxLength={500}
                          placeholder="Để trống sẽ dùng mô tả ngắn"
                          value={newsFormData.seoDescription}
                          onChange={e => setNewsFormData({ ...newsFormData, seoDescription: e.target.value })}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Từ khóa</label>
                        <input
                          type="text" className="admin-input" maxLength={500}
                          placeholder="ngăn cách bằng dấu phẩy"
                          value={newsFormData.seoKeywords}
                          onChange={e => setNewsFormData({ ...newsFormData, seoKeywords: e.target.value })}
                        />
                      </div>

                      <ImageField
                        label="Ảnh chia sẻ (OG image)"
                        type="news"
                        value={newsFormData.ogImage}
                        onChange={ogImage => setNewsFormData(f => ({ ...f, ogImage }))}
                        onUploadingChange={setImageUploading}
                        hint="Ảnh hiện khi chia sẻ lên Facebook, Zalo… Để trống sẽ dùng ảnh bìa. Khuyến nghị 1200×630."
                      />
                    </div>
                  )}
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="btn-pill ghost" disabled={newsSaving} onClick={() => setNewsModal(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-pill" disabled={newsSaving || imageUploading}>
                    {newsSaving
                      ? "Đang lưu..."
                      : newsModal.mode === "create"
                        ? (newsFormData.status === "published" ? "Đăng bài" : "Lưu bản nháp")
                        : "Cập nhật"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ===== MODAL: ADD FLASH SALE ===== */}
      {showAddFlashModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowAddFlashModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowAddFlashModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Thêm sản phẩm Flash Sale</h3>
            <form onSubmit={handleCreateFlash}>
              <div className="admin-form-group">
                <label>Sản phẩm áp dụng *</label>
                <select className="admin-select" required value={flashFormData.productId} onChange={e => handleFlashProductChange(e.target.value)}>
                  <option value="" disabled>-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({vnd(p.price)} đ)</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá gốc sản phẩm</label>
                  <input type="text" className="admin-input" disabled value={vnd(flashFormData.originalPrice) + " đ"} />
                </div>
                <div className="admin-form-group">
                  <label>Giảm giá (%) *</label>
                  <input type="number" min="0" max="100" className="admin-input" required value={flashFormData.discountPct} onChange={e => handleFlashDiscountChange(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá bán Flash Sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.price} onChange={e => handleFlashPriceChange(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.stock} onChange={e => setFlashFormData({ ...flashFormData, stock: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input type="datetime-local" className="admin-input" required value={flashFormData.startsAt} onChange={e => setFlashFormData({ ...flashFormData, startsAt: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" className="admin-input" value={flashFormData.endsAt} onChange={e => setFlashFormData({ ...flashFormData, endsAt: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group" style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center", marginTop: 12 }}>
                <input type="checkbox" id="add-flash-active" checked={flashFormData.active} onChange={e => setFlashFormData({ ...flashFormData, active: e.target.checked })} />
                <label htmlFor="add-flash-active" style={{ marginBottom: 0, cursor: "pointer" }}>Kích hoạt</label>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-pill ghost" onClick={() => setShowAddFlashModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Tạo chương trình</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT FLASH SALE ===== */}
      {showEditFlashModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowEditFlashModal(false)}>
          <div className="admin-modal-panel" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowEditFlashModal(false)}><Icon name="close" size={14} /></button>
            <h3 className="admin-modal-title">Cấu hình Flash Sale</h3>
            <form onSubmit={handleUpdateFlash}>
              <div className="admin-form-group">
                <label>Sản phẩm áp dụng</label>
                <select className="admin-select" disabled value={flashFormData.productId}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá gốc sản phẩm</label>
                  <input type="text" className="admin-input" disabled value={vnd(flashFormData.originalPrice) + " đ"} />
                </div>
                <div className="admin-form-group">
                  <label>Giảm giá (%) *</label>
                  <input type="number" min="0" max="100" className="admin-input" required value={flashFormData.discountPct} onChange={e => handleFlashDiscountChange(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Giá bán Flash Sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.price} onChange={e => handleFlashPriceChange(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label>Số lượng kho sale *</label>
                  <input type="number" min="1" className="admin-input" required value={flashFormData.stock} onChange={e => setFlashFormData({ ...flashFormData, stock: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input type="datetime-local" className="admin-input" required value={flashFormData.startsAt} onChange={e => setFlashFormData({ ...flashFormData, startsAt: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" className="admin-input" value={flashFormData.endsAt} onChange={e => setFlashFormData({ ...flashFormData, endsAt: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="admin-form-group">
                  <label>Số lượng đã bán</label>
                  <input type="number" min="0" className="admin-input" required value={flashFormData.sold} onChange={e => setFlashFormData({ ...flashFormData, sold: e.target.value })} />
                </div>
                <div className="admin-form-group" style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center", marginTop: 24 }}>
                  <input type="checkbox" id="edit-flash-active" checked={flashFormData.active} onChange={e => setFlashFormData({ ...flashFormData, active: e.target.checked })} />
                  <label htmlFor="edit-flash-active" style={{ marginBottom: 0, cursor: "pointer" }}>Kích hoạt</label>
                </div>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-pill ghost" onClick={() => setShowEditFlashModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn-pill">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
