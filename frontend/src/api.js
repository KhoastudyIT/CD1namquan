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

  // Orders
  getOrders: () => fetchAPI('/orders'),
  getOrderById: (id) => fetchAPI(`/orders/${id}`),
  createOrder: (data) => fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  createProduct: (data) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
  getAllOrders: () => fetchAPI('/orders/admin/list'),
  updateOrderStatus: (id, status) => fetchAPI(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
};
