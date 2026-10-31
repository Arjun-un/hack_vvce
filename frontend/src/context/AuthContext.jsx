import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getCurrentUserApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('opsloop_auth_token') || null;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('opsloop_auth_user');
      try {
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount if token exists
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const data = await getCurrentUserApi();
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('opsloop_auth_user', JSON.stringify(data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, keeping cached credentials:', err.message);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password, roleHint) => {
    const res = await loginApi(email, password, roleHint);
    if (res && res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('opsloop_auth_token', res.token);
      localStorage.setItem('opsloop_auth_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Authentication failed');
  };

  const register = async (payload) => {
    const res = await registerApi(payload);
    if (res && res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('opsloop_auth_token', res.token);
      localStorage.setItem('opsloop_auth_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('opsloop_auth_token');
    localStorage.removeItem('opsloop_auth_user');
  };

  const isAuthorized = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    isAuthorized
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
