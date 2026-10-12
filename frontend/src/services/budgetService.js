import api from './api';

const budgetService = {
  getBudgets: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data;
  },
  createBudget: async (payload) => {
    const response = await api.post('/budgets', payload);
    return response.data;
  },
  updateBudget: async (id, payload) => {
    const response = await api.put(`/budgets/${id}`, payload);
    return response.data;
  },
  deleteBudget: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

export default budgetService;
