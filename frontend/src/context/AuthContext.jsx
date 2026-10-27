import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, checkHealth, setDbStatusListener } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('examease_token'));
  const [loading, setLoading] = useState(true);
  const [dbState, setDbState] = useState({ isConnected: true, message: '' });

  useEffect(() => {
    // Listen for database status updates from API calls
    setDbStatusListener((status) => {
      setDbState(status);
    });

    // Initial health check
    checkHealth().then((health) => {
      if (health?.database?.connected !== undefined) {
        setDbState({
          isConnected: health.database.connected,
          message: health.database.message,
        });
      }
    });

    // Check existing auth token
    const loadCurrentUser = async () => {
      const storedToken = localStorage.getItem('examease_token');
      if (storedToken) {
        try {
          const res = await apiRequest('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          // Token expired or invalid
          if (err.status === 401 || err.status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem('examease_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Login failed');
  };

  const register = async (name, email, password, role) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    if (res.success && res.token && res.user) {
      localStorage.setItem('examease_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('examease_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    dbState,
    login,
    register,
    logout,
    refreshUser,
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
