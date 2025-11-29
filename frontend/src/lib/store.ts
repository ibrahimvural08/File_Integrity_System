import { create } from 'zustand';
import { authAPI } from './api';

interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.access_token);
    
    const user = await authAPI.getMe();
    set({ 
      token: data.access_token, 
      user, 
      isAuthenticated: true,
      isLoading: false 
    });
  },

  register: async (email: string, username: string, password: string) => {
    await authAPI.register({ email, username, password });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false 
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authAPI.getMe();
      set({ 
        user, 
        token, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch {
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },
}));
