import api from './api';

const authService = {
  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },
  login: async (payload) => {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (payload) => {
    const response = await api.put('/auth/profile', payload);
    return response.data;
  },
  changePassword: async (payload) => {
    const response = await api.put('/auth/change-password', payload);
    return response.data;
  },
};

export default authService;
