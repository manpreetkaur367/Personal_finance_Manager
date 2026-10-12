import api from './api';

const transactionService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  createTransaction: async (payload) => {
    const response = await api.post('/transactions', payload);
    return response.data;
  },
  updateTransaction: async (id, payload) => {
    const response = await api.put(`/transactions/${id}`, payload);
    return response.data;
  },
  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

export default transactionService;
