import api from './api';

const analyticsService = {
  getSummary: async (params = {}) => {
    const response = await api.get('/analytics/summary', { params });
    return response.data;
  },
  getMonthly: async (params = {}) => {
    const response = await api.get('/analytics/monthly', { params });
    return response.data;
  },
  getCategories: async (params = {}) => {
    const response = await api.get('/analytics/categories', { params });
    return response.data;
  },
  getTrends: async (params = {}) => {
    const response = await api.get('/analytics/trends', { params });
    return response.data;
  },
};

export default analyticsService;
