import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// Add JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — only redirect if it's NOT a public route
api.interceptors.response.use(
  res => res,
  err => {
    // Don't auto-redirect for these public endpoints
    const publicEndpoints = ['/alerts', '/field-reports', '/risk', '/auth/me'];
    const url = err.config?.url || '';
    const isPublicFetch = publicEndpoints.some(p => url.includes(p));
    
    if (err.response?.status === 401 && !isPublicFetch) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const riskAPI = {
  analyze: (lat, lon) => api.get('/risk', { params: { lat, lon } }),
  simulate: (data) => api.post('/risk/simulate', data),
};

export const rainfallAPI = {
  get: (lat, lon) => api.get('/rainfall', { params: { lat, lon } }),
};

export const terrainAPI = {
  get: (lat, lon) => api.get('/terrain', { params: { lat, lon } }),
};

export const landslidesAPI = {
  nearby: (lat, lon, radius = 10) => api.get('/landslides/nearby', { params: { lat, lon, radius } }),
  bbox: (bbox) => api.get('/landslides', { params: { bbox } }),
  historical: (params) => api.get('/landslides/historical-analysis', { params }),
};

export const fieldReportsAPI = {
  create: (formData) => api.post('/field-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/field-reports', { params }),
  verify: (id, data) => api.post(`/field-reports/${id}/verify`, data),
};

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  verify: (id, data) => api.post(`/alerts/${id}/verify`, data),
};

export const modelAPI = {
  status: () => api.get('/model/status'),
  metrics: () => api.get('/model/metrics'),
};

export const dataSourcesAPI = {
  health: () => api.get('/data-sources/health'),
};

export const aiAnalysisAPI = {
  analyze: (lat, lon, locationName) =>
    api.post('/ai-analysis', { lat, lon, locationName }),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export default api;
