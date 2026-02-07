import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const tokens = data.data?.tokens;
        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('Invalid refresh response');
        }

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SendPaymentPayload {
  recipientEmail: string;
  amountGBP: number;
}

export interface PreviewPaymentPayload {
  amountGBP: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      walletAddress: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload),
  
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),
  
  logout: () =>
    api.post('/auth/logout'),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getProfile: () =>
    api.get('/auth/me'),
};

export const paymentApi = {
  send: (payload: SendPaymentPayload) =>
    api.post('/payment/send', payload),

  history: (page: number = 1, limit: number = 10) =>
    api.get('/payment/history', { params: { page, limit } }),

  preview: (payload: PreviewPaymentPayload) =>
    api.post('/payment/preview', payload),

  getTransaction: (id: string) =>
    api.get(`/payment/${id}`),
};

export const walletApi = {
  balance: () =>
    api.get('/wallet/balance'),

  treasuryBalance: () =>
    api.get('/wallet/treasury'),

  deposit: (amount: number) =>
    api.post('/wallet/deposit', { amount }),

  withdraw: (amount: number) =>
    api.post('/wallet/withdraw', { amount }),

  address: () =>
    api.get('/wallet/address'),
};

export const ratesApi = {
  current: () =>
    api.get('/rates'),
};
