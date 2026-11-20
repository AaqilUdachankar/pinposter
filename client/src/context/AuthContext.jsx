import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // User profile state is kept in memory to prevent PII exposure in localStorage
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pinposter_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email: email?.trim().toLowerCase(), password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('pinposter_token', res.data.token);
      localStorage.removeItem('pinposter_user'); // Clean up any legacy PII from storage
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('pinposter_token', res.data.token);
      localStorage.removeItem('pinposter_user'); // Clean up any legacy PII from storage
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pinposter_token');
    localStorage.removeItem('pinposter_user');
  };

  const updateUser = (newUserData) => {
    setUser((prev) => ({ ...prev, ...newUserData }));
  };

  const deleteAccount = async (password) => {
    const res = await authApi.deleteAccount({ password });
    if (res.data.success) {
      logout();
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to delete account');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        register,
        logout,
        updateUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
