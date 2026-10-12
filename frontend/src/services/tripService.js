import api from './api';

const tripService = {
  getTrips: async () => {
    const response = await api.get('/trips');
    return response.data;
  },
  createTrip: async (payload) => {
    const response = await api.post('/trips', payload);
    return response.data;
  },
  updateTrip: async (id, payload) => {
    const response = await api.put(`/trips/${id}`, payload);
    return response.data;
  },
  deleteTrip: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },
  inviteMember: async (tripId, payload) => {
    const response = await api.post(`/trips/${tripId}/members/invite`, payload);
    return response.data;
  },
  resendInvitation: async (tripId, invitationId) => {
    const response = await api.post(`/trips/${tripId}/invitations/${invitationId}/resend`);
    return response.data;
  },
  verifyInvitation: async (token) => {
    const response = await api.post('/invitations/verify', { token });
    return response.data;
  },
  acceptInvitation: async (token) => {
    const response = await api.post('/invitations/accept', { token });
    return response.data;
  },
  respondInvite: async (tripId, memberId, status) => {
    const response = await api.put(`/trips/${tripId}/members/${memberId}/respond`, { status });
    return response.data;
  },
  createExpense: async (tripId, payload) => {
    const response = await api.post(`/trips/${tripId}/expenses`, payload);
    return response.data;
  },
  updateExpense: async (tripId, expenseId, payload) => {
    const response = await api.put(`/trips/${tripId}/expenses/${expenseId}`, payload);
    return response.data;
  },
  deleteExpense: async (tripId, expenseId) => {
    const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },
  addSettlement: async (tripId, payload) => {
    const response = await api.post(`/trips/${tripId}/settlements`, payload);
    return response.data;
  },
  addItineraryItem: async (tripId, payload) => {
    const response = await api.post(`/trips/${tripId}/itinerary`, payload);
    return response.data;
  },
  updateItineraryItem: async (tripId, itemId, payload) => {
    const response = await api.put(`/trips/${tripId}/itinerary/${itemId}`, payload);
    return response.data;
  },
  deleteItineraryItem: async (tripId, itemId) => {
    const response = await api.delete(`/trips/${tripId}/itinerary/${itemId}`);
    return response.data;
  },
  getTripAnalytics: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/analytics`);
    return response.data;
  },
};

export default tripService;
