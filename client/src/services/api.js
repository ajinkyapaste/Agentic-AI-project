import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach Authorization Bearer token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const datasetsApi = {
  list: () => api.get('/datasets'),
  inspect: (formData) => api.post('/datasets/inspect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  confirm: (data) => api.post('/datasets/confirm', data),
  getById: (id) => api.get(`/datasets/${id}`),
  delete: (id) => api.delete(`/datasets/${id}`),
};

export const analyticsApi = {
  getKpis: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/kpis`, { params }),
  getSeasonal: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/seasonal`, { params }),
  getTrends: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/trends`, { params }),
  getProducts: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/products`, { params }),
  getCategories: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/categories`, { params }),
  getRegions: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/regions`, { params }),
  getSegments: (datasetId, params = {}) => api.get(`/analytics/${datasetId}/segments`, { params }),
};

export const forecastingApi = {
  predict: (datasetId, data) => api.post(`/forecasting/${datasetId}/predict`, data),
  getAnomalies: (datasetId, params = {}) => api.get(`/forecasting/${datasetId}/anomalies`, { params }),
  getRuns: (datasetId) => api.get(`/forecasting/${datasetId}/runs`),
};

export const aiApi = {
  getInsights: (datasetId) => api.get(`/ai/${datasetId}/insights`),
  chat: (datasetId, data) => api.post(`/ai/${datasetId}/chat`, data),
};

export const reportsApi = {
  getPdfUrl: (datasetId) => `/api/reports/${datasetId}/pdf?token=${localStorage.getItem('token') || ''}`,
  getExcelUrl: (datasetId) => `/api/reports/${datasetId}/excel?token=${localStorage.getItem('token') || ''}`,
  getCsvUrl: (datasetId) => `/api/reports/${datasetId}/csv?token=${localStorage.getItem('token') || ''}`,
  downloadPdf: (datasetId) => api.get(`/reports/${datasetId}/pdf`, { responseType: 'blob' }),
  downloadExcel: (datasetId) => api.get(`/reports/${datasetId}/excel`, { responseType: 'blob' }),
  downloadCsv: (datasetId) => api.get(`/reports/${datasetId}/csv`, { responseType: 'blob' }),
};

export default api;

