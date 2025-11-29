import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { email: string; username: string; password: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

// Files API
export const filesAPI = {
  upload: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  list: async (skip = 0, limit = 50) => {
    const response = await api.get(`/api/files/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getFile: async (fileId: number) => {
    const response = await api.get(`/api/files/${fileId}`);
    return response.data;
  },

  download: async (fileId: number) => {
    const response = await api.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  verify: async (fileId: number) => {
    const response = await api.post(`/api/files/${fileId}/verify`);
    return response.data;
  },

  getHistory: async (fileId: number) => {
    const response = await api.get(`/api/files/${fileId}/history`);
    return response.data;
  },

  delete: async (fileId: number) => {
    await api.delete(`/api/files/${fileId}`);
  },

  getDashboardStats: async () => {
    const response = await api.get('/api/files/dashboard/stats');
    return response.data;
  },
};

export default api;
