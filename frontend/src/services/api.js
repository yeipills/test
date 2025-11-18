import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const productsAPI = {
  getAll: () => api.get('/api/products/'),
  search: (params) => api.get('/api/products/search', { params }),
  getById: (id) => api.get(`/api/products/${id}`),
  analyze: (id) => api.get(`/api/products/${id}/analyze`),
  getByBarcode: (barcode, useExternal = false) =>
    api.get(`/api/products/barcode/${barcode}`, { params: { use_external: useExternal } }),
  compare: (productIds) => api.post('/api/products/compare', productIds),
  getCatalog: () => api.get('/api/products/catalog'),
  getCategories: () => api.get('/api/products/categories'),
};

// Shopping List API
export const shoppingListAPI = {
  optimize: (shoppingList) => api.post('/api/shopping-list/optimize', shoppingList),
  quickOptimize: (data) => api.post('/api/shopping-list/quick-optimize', data),
  estimate: (items) => api.post('/api/shopping-list/estimate', items),
  getTemplates: () => api.get('/api/shopping-list/templates'),
};

// Recommendations API
export const recommendationsAPI = {
  getSubstitutions: (productId, focus = 'balanced', maxResults = 5) =>
    api.get(`/api/recommendations/substitute/${productId}`, {
      params: { focus, max_results: maxResults },
    }),
  batchSubstitute: (productIds, focus = 'balanced') =>
    api.post('/api/recommendations/batch-substitute', productIds, { params: { focus } }),
  getSimilar: (productId, limit = 5) =>
    api.get(`/api/recommendations/similar/${productId}`, { params: { limit } }),
  getTopSustainable: (category = null, limit = 10) =>
    api.get('/api/recommendations/top-sustainable', { params: { category, limit } }),
  getBestValue: (category = null, limit = 10) =>
    api.get('/api/recommendations/best-value', { params: { category, limit } }),
  getSavingsOpportunities: (minSavingsPercentage = 10) =>
    api.get('/api/recommendations/savings-opportunities', {
      params: { min_savings_percentage: minSavingsPercentage },
    }),
};

// Stats API
export const statsAPI = {
  getStats: () => api.get('/api/stats'),
  getHealth: () => api.get('/health'),
};

export default api;
