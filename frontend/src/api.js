const API_URL = 'http://localhost:3000/api/v1';

async function fetchAPI(endpoint, options = {}, returnFull = false) {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Lỗi kết nối server');
    }
    return returnFull ? json : (json.data || json);
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

export const api = {
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
  getNews: () => fetchAPI('/news'),
  getNewsById: (id) => fetchAPI(`/news/${id}`),

  // Auth
  login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/auth/me'),

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
  createNews: (data) => fetchAPI('/news', { method: 'POST', body: JSON.stringify(data) }),
  updateNews: (id, data) => fetchAPI(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNews: (id) => fetchAPI(`/news/${id}`, { method: 'DELETE' })
};
