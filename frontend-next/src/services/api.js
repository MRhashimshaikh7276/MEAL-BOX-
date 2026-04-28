import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// note: individual calls that upload files override content-type to multipart/form-data


// Request interceptor - attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        localStorage.setItem('accessToken', res.data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`
        return axiosInstance(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => axiosInstance.post('/auth/register', data),
  login: (data) => axiosInstance.post('/auth/login', data),
  logout: () => axiosInstance.post('/auth/logout'),
  getProfile: () => axiosInstance.get('/auth/profile'),
  updateProfile: (data) => axiosInstance.put('/auth/profile', data),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => axiosInstance.post(`/auth/reset-password/${token}`, { password }),
  validateReferral: (code) => axiosInstance.post('/auth/validate-referral', { referralCode: code }),
  getReferral: () => axiosInstance.get('/auth/referral'),
}

// Category API
export const categoryAPI = {
  getAll: () => axiosInstance.get('/categories'),
  create: (data) => axiosInstance.post('/categories', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => axiosInstance.put(`/categories/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => axiosInstance.delete(`/categories/${id}`),
  // helper for front end; not used by backend directly
  // kept for backwards compatibility if ever needed
  getSubcategories: (catId) => axiosInstance.get('/subcategories', { params: { categoryId: catId } }),
}

// Subcategory API
export const subcategoryAPI = {
  getAll: (categoryId) => axiosInstance.get('/subcategories', { params: { categoryId } }),
  create: (data) => axiosInstance.post('/subcategories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => axiosInstance.put(`/subcategories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => axiosInstance.delete(`/subcategories/${id}`),
}

// Sub‑Subcategory API
export const subsubcategoryAPI = {
  getAll: (params = {}) => axiosInstance.get('/subsubcategories', { params }),
  create: (data) => axiosInstance.post('/subsubcategories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => axiosInstance.put(`/subsubcategories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => axiosInstance.delete(`/subsubcategories/${id}`),
}

// Product API
export const productAPI = {
  getAll: (params) => axiosInstance.get('/products', { params }),
  getById: (id) => axiosInstance.get(`/products/${id}`),
  create: (data) => axiosInstance.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => axiosInstance.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => axiosInstance.delete(`/products/${id}`),
}

// Cart API
export const cartAPI = {
  getCart: () => axiosInstance.get('/cart'),
  addToCart: (data) => axiosInstance.post('/cart/add', data),
  updateCart: (data) => axiosInstance.put('/cart/update', data),
  removeFromCart: (productId, comboId) => {
    if (comboId) {
      return axiosInstance.delete('/cart/remove-item', { params: { comboId } });
    }
    return axiosInstance.delete(`/cart/remove/${productId}`);
  },
  clearCart: () => axiosInstance.delete('/cart/clear'),
}

// Order API
export const orderAPI = {
  place: (data) => axiosInstance.post('/orders', data),
  // user orders: primary endpoint is /api/orders, but older code might hit
  // /api/orders/my so we try that first and fall back if we get 404.
  getMyOrders: () =>
    axiosInstance.get('/orders').catch(err => {
      if (err.response?.status === 404) return axiosInstance.get('/orders/my')
      throw err
    }),
  getById: (id) => axiosInstance.get(`/orders/${id}`),
  cancel: (id) => axiosInstance.put(`/orders/${id}/cancel`),
  // QR code for COD payment
  getPaymentQR: (orderId) => axiosInstance.get(`/orders/${orderId}/payment-qr`),
  markAsPaid: (orderId) => axiosInstance.put(`/orders/${orderId}/mark-paid`),
  updatePreparationTime: (orderId, preparationTime) => 
    axiosInstance.patch(`/orders/${orderId}/preparation-time`, { preparationTime }),
}

// Offer API
export const offerAPI = {
  validate: (code) => axiosInstance.post('/offers/validate', { code }),
  getAll: () => axiosInstance.get('/offers'),
  create: (data) => axiosInstance.post('/offers', data),
  update: (id, data) => axiosInstance.put(`/offers/${id}`, data),
  delete: (id) => axiosInstance.delete(`/offers/${id}`),
}

// Review API
export const reviewAPI = {
  add: (data) => axiosInstance.post('/reviews', data),
  getByProduct: (productId, params = {}) => axiosInstance.get(`/reviews/product/${productId}`, { params }),
  getStats: () => axiosInstance.get('/reviews/stats'),
}

// Booking API
export const bookingAPI = {
  create: (data) => axiosInstance.post('/bookings', data),
  getAll: (params = {}) => axiosInstance.get('/bookings', { params }),
  getMy: () => axiosInstance.get('/bookings/my-bookings'),
  updateStatus: (id, data) => axiosInstance.put(`/bookings/${id}`, data),
  delete: (id) => axiosInstance.delete(`/bookings/${id}`),
}

// Address API
export const addressAPI = {
  getAll: () => axiosInstance.get('/addresses'),
  add: (data) => axiosInstance.post('/addresses', data),
  update: (id, data) => axiosInstance.put(`/addresses/${id}`, data),
  delete: (id) => axiosInstance.delete(`/addresses/${id}`),
  setDefault: (id) => axiosInstance.put(`/addresses/${id}/set-default`),
}

// Admin API
export const adminAPI = {
  getDashboard: () => axiosInstance.get('/admin/dashboard'),
  getReports: (params) => axiosInstance.get('/admin/reports', { params }),
  getUsers: (params) => axiosInstance.get('/admin/users', { params }),
  createUser: (data) => axiosInstance.post('/admin/users', data),
  blockUser: (id) => axiosInstance.put(`/admin/users/${id}/block`),
  unblockUser: (id) => axiosInstance.put(`/admin/users/${id}/unblock`),
  // supports both admin path and the original orders route for backwards compatibility
  getOrders: (params) => axiosInstance.get('/admin/orders', { params }),
  // new helper that hits the order-specific route used by order.routes
  getAllOrders: (params) => axiosInstance.get('/orders/admin/all', { params }),
  getCODCollections: (params) => axiosInstance.get('/orders/admin/cod-collections', { params }),
  getOrderById: (id) => axiosInstance.get(`/orders/${id}`),
  updateOrderStatus: (id, data) => axiosInstance.put(`/orders/${id}/status`, data),
  assignDelivery: (orderId, deliveryBoyId) => axiosInstance.put(`/admin/orders/${orderId}/assign`, { deliveryBoyId }),
  getDeliveryBoys: () => axiosInstance.get('/admin/delivery-boys'),
}

// Delivery API
export const deliveryAPI = {
  getAssignedOrders: () => axiosInstance.get('/delivery/orders'),
  updateStatus: (id, status) => axiosInstance.put(`/delivery/orders/${id}/status`, { status }),
  updateLocation: (lat, lng) => axiosInstance.put('/delivery/location', { lat, lng }),
  getDeliveryLocation: (orderId) => axiosInstance.get(`/delivery/${orderId}/location`),
}

// General Settings API
export const generalSettingsAPI = {
  get: () => axiosInstance.get('/general-settings'),
  getStatus: () => axiosInstance.get('/general-settings/status'),
  update: (data) => axiosInstance.put('/general-settings', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  blockDate: (date, reason, action, startTime, endTime) => axiosInstance.post('/general-settings/blocked-date', { date, reason, action, startTime, endTime }),
}

// Combo API
export const comboAPI = {
  getAll: () => axiosInstance.get('/combos'),
  getById: (id) => axiosInstance.get(`/combos/${id}`),
  create: (data) => axiosInstance.post('/combos', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => axiosInstance.put(`/combos/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => axiosInstance.delete(`/combos/${id}`),
}

// Payment API - using fetch to avoid axios interceptor issues
export const paymentAPI = {
  createOrder: async (orderId) => {
    const token = localStorage.getItem('accessToken')
    console.log('Payment createOrder - Token:', token ? 'exists' : 'null')
    console.log('Payment createOrder - BASE_URL:', BASE_URL)
    const response = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ orderId })
    })
    console.log('Payment createOrder - Response status:', response.status)
    const data = await response.json()
    if (!response.ok) throw { response: { status: response.status, data } }
    return { data }
  },
  verify: async (data) => {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!response.ok) throw { response: { status: response.status, data: result } }
    return { data: result }
  },
}

// Banner Section API
export const bannerSectionAPI = {
  getAll: () => axiosInstance.get('/banner-sections'),
  getById: (id) => axiosInstance.get(`/banner-sections/${id}`),
  create: (data) => axiosInstance.post('/banner-sections', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  update: (id, data) => axiosInstance.put(`/banner-sections/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => axiosInstance.delete(`/banner-sections/${id}`),
}

// Add Ones API 
export const addOnesAPI = {
  getAll: () => axiosInstance.get('/add-ones'),
  getByProduct: (productId) => axiosInstance.get('/add-ones/by-product', { params: { productId } }),
  create: (data) => axiosInstance.post('/add-ones', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
      
  update: (id, data) => axiosInstance.put(`/add-ones/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id) => axiosInstance.delete(`/add-ones/${id}`),
}

// Wallet API
export const walletAPI = {
  getWallet: () => axiosInstance.get('/wallet'),
  createOrder: (amount) => axiosInstance.post('/wallet/create-order', { amount }),
  verifyPayment: (data) => axiosInstance.post('/wallet/verify-payment', data),
  addMoney: (amount, description) => axiosInstance.post('/wallet/add-money', { amount, description }),
  deduct: (amount, description, orderId) => axiosInstance.post('/wallet/deduct', { amount, description, orderId }),
  getTransactions: () => axiosInstance.get('/wallet/transactions'),
}

export default axiosInstance

