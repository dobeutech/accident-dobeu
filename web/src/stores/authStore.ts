import { create } from 'zustand';
import { User, AuthState } from '../types';
import { api } from '../lib/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadStoredAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    const { token, user } = response.data;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      
      if (token && userJson) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token is still valid
        const response = await api.get('/auth/me');
        
        set({
          user: response.data.user || response.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
      
      set({ isLoading: false });
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      delete api.defaults.headers.common['Authorization'];
      set({ isLoading: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },
}));
