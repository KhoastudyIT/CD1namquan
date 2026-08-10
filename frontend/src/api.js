import { products, categories, collections, news as sampleNews } from './data.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

async function fetchAPI(endpoint, options = {}, returnFull = false) {

  let unreachable = false;
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let res;
    try {
      res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } catch (netErr) {
      unreachable = true;
      throw netErr;
    }

    // Handle 204 No Content (e.g. DELETE endpoints) — no body to parse
    if (res.status === 204) {
      if (!res.ok) throw new Error('Lỗi kết nối server');
      return { success: true };
    }

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Lỗi kết nối server');
    }
    return returnFull ? json : (json.data || json);
  } catch (err) {
    const method = (options.method || 'GET').toUpperCase();
    if (!unreachable || method !== 'GET') {
      console.error('API Error:', err);
      throw err;
    }

    console.warn('API fallback active for endpoint:', endpoint);
    // Graceful fallback for public deployments when localhost:3000 is unreachable
    if (endpoint.includes('/products/flash-sales')) {
      return products.slice(0, 8);
    }
    if (endpoint.includes('/products/')) {
      const id = parseInt(endpoint.split('/products/')[1], 10);
      const found = products.find(p => p.id === id) || products[0];
      return returnFull ? { success: true, data: found } : found;
    }
    if (endpoint.includes('/products')) {
      const searchParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const cat = searchParams.get('category');
      const search = searchParams.get('search');
      let filtered = [...products];
      if (cat) {
        filtered = filtered.filter(p =>
          (p.category && p.category.toLowerCase().includes(cat.toLowerCase())) ||
          (p.type && p.type.toLowerCase().includes(cat.toLowerCase()))
        );
      }
      if (search) {
        filtered = filtered.filter(p => p.name && p.name.toLowerCase().includes(search.toLowerCase()));
      }
      const pageNum = parseInt(searchParams.get('page') || '1', 10);
      const limitNum = parseInt(searchParams.get('limit') || '15', 10);
      const totalPages = Math.ceil(filtered.length / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      const pageData = filtered.slice(startIndex, startIndex + limitNum);
      return returnFull ? { success: true, data: pageData, meta: { total: filtered.length, page: pageNum, limit: limitNum, totalPages } } : pageData;
    }
    if (endpoint.includes('/categories')) return categories;
    if (endpoint.includes('/collections')) return collections;
    if (endpoint.includes('/news')) return sampleNews;
    if (endpoint.includes('/settings')) return DEFAULT_SETTINGS;
    throw err;
  }
}

/**
 * Giá trị hiển thị khi chưa tải xong cấu hình (hoặc backend không với tới).
 * Header/Footer render ngay từ lần vẽ đầu nên không thể để trống — trống sẽ gây
 * nhấp nháy layout rồi mới có chữ.
 */
export const DEFAULT_SETTINGS = {
  companyName: 'NAM QUAN',
  slogan: 'NỘI THẤT CAO CẤP',
  about: '',
  mission: '',
  vision: '',
  phone: '',
  email: '',
  address: '',
  mapUrl: '',
  facebook: '',
  instagram: '',
  youtube: '',
  tiktok: '',
  logo: '',
};

// Chặn sớm ở client cho phản hồi tức thì — backend vẫn kiểm tra lại y hệt.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateImageFile(file) {
  if (!IMAGE_MIMES.includes(file.type)) return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.';
  if (file.size > IMAGE_MAX_BYTES) return 'Ảnh tối đa 5MB.';
  return null;
}

export const api = {
  /**
   * Tải ảnh lên theo 2 bước: xin URL có chữ ký từ backend, rồi PUT file thẳng
   * lên MinIO. File không đi qua API nên không vướng giới hạn body của Express.
   * @param {File} file
   * @param {'news'|'products'|'categories'|'collections'|'settings'} type Quyết định thư mục lưu
   * @returns {Promise<string>} publicUrl để lưu vào trường `img`
   */
  uploadImage: async (file, type) => {
    const invalid = validateImageFile(file);
    if (invalid) throw new Error(invalid);

    const { uploadUrl, publicUrl } = await fetchAPI('/uploads/image-url', {
      method: 'POST',
      body: JSON.stringify({ type, mimeType: file.type, size: file.size, originalName: file.name }),
    });

    // Gọi thẳng MinIO — không dùng fetchAPI vì khác origin và không cần token.
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!put.ok) throw new Error(`Tải ảnh lên thất bại (HTTP ${put.status}).`);

    return publicUrl;
  },

  // Products & Public
  getProducts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/products${q ? `?${q}` : ''}`);
  },
  getProductsPaginated: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/products${q ? `?${q}` : ''}`, {}, true);
  },
  getProductById: (id) => fetchAPI(`/products/${id}`),
  getFlashSales: () => fetchAPI('/products/flash-sales'),
  getCategories: () => fetchAPI('/categories'),
  getCollections: () => fetchAPI('/collections'),
  // Thông tin công ty — công khai, dùng cho Header/Footer/Drawer
  getSettings: () => fetchAPI('/settings'),
  // News — công khai (chỉ bài đã đăng)
  getNews: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/news${q ? `?${q}` : ''}`);
  },
  getNewsPaginated: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/news${q ? `?${q}` : ''}`, {}, true);
  },
  getNewsCategories: () => fetchAPI('/news/categories'),
  // Nhận cả id lẫn slug
  getNewsById: (idOrSlug) => fetchAPI(`/news/${idOrSlug}`),
  getRelatedNews: (idOrSlug, limit = 3) => fetchAPI(`/news/${idOrSlug}/related?limit=${limit}`),

  // Auth
  login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/auth/me'),
  updateProfile: (data) => fetchAPI('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => fetchAPI('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),

  // Cart
  getCart: () => fetchAPI('/cart'),
  addToCart: (productId, quantity = 1) => fetchAPI('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (productId, quantity) => fetchAPI(`/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (productId) => fetchAPI(`/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () => fetchAPI('/cart', { method: 'DELETE' }),

  // Notifications
  getNotifications: () => fetchAPI('/notifications'),
  markNotificationRead: (id) => fetchAPI(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => fetchAPI('/notifications/read-all', { method: 'PUT' }),

  // Chat — khách hàng
  getChatConversation: () => fetchAPI('/chat/conversation'),
  // afterId = id tin nhắn cuối client đang có; server chỉ trả phần mới hơn.
  pollChatMessages: (afterId = 0) => fetchAPI(`/chat/messages?after=${afterId}`),
  sendChatMessage: (message, productId = null) =>
    fetchAPI('/chat/messages', { method: 'POST', body: JSON.stringify({ message, productId }) }),
  markChatRead: () => fetchAPI('/chat/read', { method: 'PUT' }),

  // Chat — quản trị
  getChatConversations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/chat/admin/conversations${q ? `?${q}` : ''}`);
  },
  getChatConversationDetail: (id, afterId = 0) =>
    fetchAPI(`/chat/admin/conversations/${id}?after=${afterId}`),
  replyChatAsStaff: (id, message) =>
    fetchAPI(`/chat/admin/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  updateChatConversation: (id, data) =>
    fetchAPI(`/chat/admin/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  markChatConversationRead: (id) =>
    fetchAPI(`/chat/admin/conversations/${id}/read`, { method: 'PUT' }),
  getChatUnreadCount: () => fetchAPI('/chat/admin/unread-count'),

  // Orders
  getOrders: () => fetchAPI('/orders'),
  getOrderById: (id) => fetchAPI(`/orders/${id}`),
  createOrder: (data) => fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) }),

  // Admin — Products & Orders
  createProduct: (data) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
  getAllOrders: () => fetchAPI('/orders/admin/list'),
  updateOrderStatus: (id, status) => fetchAPI(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getStatsOverview: () => fetchAPI('/stats/overview'),

  // Admin — Users
  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/users${q ? `?${q}` : ''}`, {}, true);
  },
  getUserById: (id) => fetchAPI(`/users/${id}`),
  updateUserRole: (id, role) => fetchAPI(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateUserStatus: (id, status) => fetchAPI(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Admin — Categories
  createCategory: (data) => fetchAPI('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => fetchAPI(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => fetchAPI(`/categories/${id}`, { method: 'DELETE' }),

  // Admin — Collections
  createCollection: (data) => fetchAPI('/collections', { method: 'POST', body: JSON.stringify(data) }),
  updateCollection: (id, data) => fetchAPI(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollection: (id) => fetchAPI(`/collections/${id}`, { method: 'DELETE' }),

  // Admin — News
  getNewsAdmin: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/news/admin/list${q ? `?${q}` : ''}`, {}, true);
  },
  getNewsAdminById: (id) => fetchAPI(`/news/admin/${id}`),
  createNews: (data) => fetchAPI('/news', { method: 'POST', body: JSON.stringify(data) }),
  updateNews: (id, data) => fetchAPI(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateNewsStatus: (id, status) => fetchAPI(`/news/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteNews: (id) => fetchAPI(`/news/${id}`, { method: 'DELETE' }),

  // Admin — Thông tin công ty
  updateSettings: (data) => fetchAPI('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Admin — Flash Sales
  getFlashSalesAdmin: () => fetchAPI('/products/flash-sales/admin'),
  createFlashSale: (data) => fetchAPI('/products/flash-sales/admin', { method: 'POST', body: JSON.stringify(data) }),
  updateFlashSale: (id, data) => fetchAPI(`/products/flash-sales/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFlashSale: (id) => fetchAPI(`/products/flash-sales/admin/${id}`, { method: 'DELETE' })
};
