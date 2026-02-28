import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshUrl = originalRequest?.url?.includes('/auth/refresh');
    const isAuthUrl = originalRequest?.url?.includes('/auth/login') ||
                      originalRequest?.url?.includes('/auth/register');

    if (isRefreshUrl) {
      refreshPromise = null;
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthUrl
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then(() => { refreshPromise = null; })
          .catch((err) => {
            refreshPromise = null;
            throw err;
          });
      }

      try {
        await refreshPromise;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
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
  
  refresh: () =>
    api.post('/auth/refresh', {}),

  getProfile: () =>
    api.get('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, token: string, password: string) =>
    api.post('/auth/reset-password', { email, token, password }),
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

  createTopUpIntent: (amountGBP: number) =>
    api.post<{ success: boolean; data: { clientSecret: string; intentId: string } }>(
      '/payment/topup/intent',
      { amountGBP }
    ),

  confirmTopUp: (intentId: string) =>
    api.post<{ success: boolean; data: { amountGBP: number; newBalance: number } }>(
      '/payment/topup/confirm',
      { intentId }
    ),
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

export const analyticsApi = {
  summary: () =>
    api.get('/analytics/summary'),

  export: () =>
    api.get('/analytics/export', { responseType: 'blob' }),

  lookupRecipient: (email: string) =>
    api.get('/analytics/lookup', { params: { email } }),
};
