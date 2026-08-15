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

/**
 * Tải tệp nhị phân (PDF, Excel) từ API.
 *
 * Không dùng thẻ <a href> trực tiếp được vì các tuyến này đòi Bearer token —
 * trình duyệt sẽ không tự gắn header. Vì vậy phải fetch kèm token rồi tạo URL
 * tạm từ blob nhận về.
 *
 * @param {string} endpoint  Đường dẫn API, ví dụ '/orders/abc/invoice'
 * @returns {Promise<{url: string, fileName: string, revoke: () => void}>}
 */
async function fetchFile(endpoint, fallbackName) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    // Lỗi trả về vẫn là JSON nên đọc ra để hiện đúng thông báo cho người dùng.
    let message = `Tải tệp thất bại (HTTP ${res.status}).`;
    try { message = (await res.json()).message || message; } catch { /* giữ mặc định */ }
    throw new Error(message);
  }

  // Ưu tiên tên tệp do server đặt trong Content-Disposition.
  const disposition = res.headers.get('Content-Disposition') || '';
  const matched = disposition.match(/filename="?([^";]+)"?/);
  const fileName = matched ? matched[1] : fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { url, fileName, revoke: () => URL.revokeObjectURL(url) };
}

export const api = {
  /** Mở hoá đơn PDF ở tab mới để người dùng xem rồi in hoặc lưu lại. */
  openInvoice: async (orderId) => {
    const { url, revoke } = await fetchFile(`/orders/${orderId}/invoice`, 'hoa-don.pdf');
    const win = window.open(url, '_blank');
    if (!win) throw new Error('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép rồi thử lại.');
    // Giữ URL đủ lâu cho tab mới nạp xong rồi mới thu hồi.
    setTimeout(revoke, 60_000);
  },

  /** Tải báo cáo thống kê Excel về máy. */
  downloadStatsExcel: async ({ from, to } = {}) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const { url, fileName, revoke } = await fetchFile(
      `/stats/export${q.toString() ? `?${q}` : ''}`,
      'thong-ke.xlsx',
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    revoke();
  },

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

  uploadReturnImage: async (file) => {
    const invalid = validateImageFile(file);
    if (invalid) throw new Error(invalid);

    const { uploadUrl, objectKey } = await fetchAPI('/uploads/image-url', {
      method: 'POST',
      body: JSON.stringify({ type: 'returns', mimeType: file.type, size: file.size, originalName: file.name }),
    });
    const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!put.ok) throw new Error(`Tải ảnh lên thất bại (HTTP ${put.status}).`);
    return objectKey;
  },

  // Trả / đổi hàng — khách hàng
  getMyReturns: () => fetchAPI('/returns'),
  createReturn: (data) => fetchAPI('/returns', { method: 'POST', body: JSON.stringify(data) }),
  cancelReturn: (id) => fetchAPI(`/returns/${id}`, { method: 'DELETE' }),

  // Trả / đổi hàng — admin & nhân viên
  getReturnsAdmin: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/returns/admin/list${q ? `?${q}` : ''}`, {}, true);
  },
  getReturnStats: () => fetchAPI('/returns/admin/stats'),
  updateReturnStatus: (id, data) => fetchAPI(`/returns/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

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
  // Yêu cầu tư vấn
  createConsultation: (data) => fetchAPI('/consultations', { method: 'POST', body: JSON.stringify(data) }),

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
  getConversation: () => fetchAPI('/chat/conversation'),
  getMessages: (after = 0) => fetchAPI(`/chat/messages?after=${after}`),
  pollChatMessages: (after = 0) => fetchAPI(`/chat/messages?after=${after}`),
  sendMessage: (data) => fetchAPI('/chat/messages', { method: 'POST', body: JSON.stringify(typeof data === 'string' ? { message: data } : data) }),
  sendChatMessage: (message, productId = null) => fetchAPI('/chat/messages', { method: 'POST', body: JSON.stringify({ message, productId }) }),
  markRead: () => fetchAPI('/chat/read', { method: 'PUT' }),
  markChatRead: () => fetchAPI('/chat/read', { method: 'PUT' }),

  // Admin Chat
  getAdminConversations: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return fetchAPI(`/chat/admin/conversations${queryStr}`);
  },
  getChatConversations: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.search) q.append('search', params.search);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return fetchAPI(`/chat/admin/conversations${queryStr}`);
  },
  getAdminConversationDetail: (id, after = 0) => fetchAPI(`/chat/admin/conversations/${id}${after ? `?after=${after}` : ''}`),
  getChatConversationDetail: (id, after = 0) => fetchAPI(`/chat/admin/conversations/${id}${after ? `?after=${after}` : ''}`),
  replyAsStaff: (id, data) => fetchAPI(`/chat/admin/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(typeof data === 'string' ? { message: data } : data) }),
  replyChatAsStaff: (id, data) => fetchAPI(`/chat/admin/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(typeof data === 'string' ? { message: data } : data) }),
  updateConversation: (id, data) => fetchAPI(`/chat/admin/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateChatConversation: (id, data) => fetchAPI(`/chat/admin/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  markAdminConversationRead: (id) => fetchAPI(`/chat/admin/conversations/${id}/read`, { method: 'PUT' }),
  markChatConversationRead: (id) => fetchAPI(`/chat/admin/conversations/${id}/read`, { method: 'PUT' }),
  getUnreadChatCount: () => fetchAPI('/chat/admin/unread-count'),
  getChatUnreadCount: () => fetchAPI('/chat/admin/unread-count'),
  getQuickChatNotes: () => fetchAPI('/chat/admin/quick-notes'),
  createQuickChatNote: (text) => fetchAPI('/chat/admin/quick-notes', { method: 'POST', body: JSON.stringify({ text }) }),
  deleteQuickChatNote: (id) => fetchAPI(`/chat/admin/quick-notes/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: () => fetchAPI('/orders'),
  getOrderById: (id) => fetchAPI(`/orders/${id}`),
  createOrder: (data) => fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) }),
  cancelOrder: (id) => fetchAPI(`/orders/${id}/cancel`, { method: 'POST' }),

  // Admin — Products & Orders
  createProduct: (data) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
  getAllOrders: () => fetchAPI('/orders/admin/list'),
  updateOrderStatus: (id, status) => fetchAPI(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getStatsOverview: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/stats/overview${q ? `?${q}` : ''}`);
  },

  // Admin — Users
  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/users${q ? `?${q}` : ''}`, {}, true);
  },
  getUserById: (id) => fetchAPI(`/users/${id}`),
  createUser: (data) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserRole: (id, role) => fetchAPI(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateUserStatus: (id, status) => fetchAPI(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateUserNote: (id, note) => fetchAPI(`/users/${id}/note`, { method: 'PUT', body: JSON.stringify({ note }) }),

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

  // Admin — Yêu cầu tư vấn
  getConsultations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchAPI(`/consultations${q ? `?${q}` : ''}`, {}, true);
  },
  getConsultationStats: () => fetchAPI('/consultations/stats'),
  updateConsultationStatus: (id, status) =>
    fetchAPI(`/consultations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteConsultation: (id) => fetchAPI(`/consultations/${id}`, { method: 'DELETE' }),

  // Admin — Flash Sales
  getFlashSalesAdmin: () => fetchAPI('/products/flash-sales/admin'),
  createFlashSale: (data) => fetchAPI('/products/flash-sales/admin', { method: 'POST', body: JSON.stringify(data) }),
  updateFlashSale: (id, data) => fetchAPI(`/products/flash-sales/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFlashSale: (id) => fetchAPI(`/products/flash-sales/admin/${id}`, { method: 'DELETE' })
};
