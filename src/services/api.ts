import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {BASE_URL} from '@env';
import {triggerLogout} from './authBridge';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  error => {
    return Promise.reject(error);
  },
);

// --- Token refresh (single-flight) ---------------------------------------
// While one refresh is in progress, other 401s queue and resume once it
// resolves, instead of each firing its own refresh.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  pendingQueue.forEach(cb => cb(token));
  pendingQueue = [];
};

const clearSession = async () => {
  await AsyncStorage.multiRemove(['token', 'refreshToken', 'userId']);
};

/** Calls /api/auth/refresh with a bare axios (no interceptor recursion). */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }
  try {
    const resp = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken,
    });
    const newToken = resp.data?.token;
    const newRefresh = resp.data?.refreshToken;
    if (newToken) {
      await AsyncStorage.setItem('token', newToken);
      if (newRefresh) {
        await AsyncStorage.setItem('refreshToken', newRefresh);
      }
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url: string = originalRequest?.url || '';

    // Never try to refresh the auth calls themselves.
    const isAuthCall =
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/signin-with-google') ||
      url.includes('/api/auth/signup');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;

      // A refresh is already running — wait for it, then replay this request.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token: string | null) => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      flushQueue(newToken);

      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Refresh failed → session is over.
      await clearSession();
      triggerLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
