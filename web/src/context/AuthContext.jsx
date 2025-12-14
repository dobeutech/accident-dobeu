import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    if (isLoggingIn) {
      return { success: false, error: 'Login in progress' };
    }
    
    setIsLoggingIn(true);
    try {
      const response = await authService.login(email, password);
      const { user: userData } = response.data;
      
      setUser(userData);
      
      // Check for redirect path
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login');
      }
      
      return { success: true, redirectPath };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isLoggingIn,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

