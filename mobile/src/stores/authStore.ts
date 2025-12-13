import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState } from '../types';
import { ApiService } from '../services/ApiService';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const response = await ApiService.login(email, password);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const { token, user } = response.data!;
      
      // Store credentials securely
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      
      // Update API service with token
      ApiService.setToken(token);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      ApiService.setToken(null);
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        ApiService.setToken(token);
        
        // Verify token is still valid
        const response = await ApiService.getMe();
        
        if (response.data) {
          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Load auth error:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
