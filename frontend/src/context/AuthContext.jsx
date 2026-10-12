import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.user || null);
      return response.user;
    } catch (_error) {
      localStorage.removeItem('spendwise_token');
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response?.token) {
      localStorage.setItem('spendwise_token', response.token);
    }
    setUser(response.user);
    return response;
  };

  const register = async (credentials) => {
    const response = await authService.register(credentials);
    if (response?.token) {
      localStorage.setItem('spendwise_token', response.token);
    }
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    localStorage.removeItem('spendwise_token');
    setUser(null);
    try {
      await authService.logout();
    } catch (_error) {
      // The local session is already cleared; a server logout failure must not
      // keep the user signed in on this device.
    }
  };

  const updateProfile = async (payload) => {
    const response = await authService.updateProfile(payload);
    setUser(response.user);
    return response;
  };

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, refreshUser, updateProfile }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
