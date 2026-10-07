import axios from 'axios';
import toast from 'react-hot-toast';
import { tokenStorage } from './tokenStorage';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** true: lỗi không hiện thông báo (dùng cho request chạy ngầm) */
    silent?: boolean;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('session_id');
    const token = tokenStorage.get();

    if (sessionId && config.url?.includes('/cart')) {
      config.headers['X-Session-ID'] = sessionId;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Có lỗi xảy ra';
    // Request chạy ngầm (ví dụ tự kiểm tra trạng thái thanh toán) không hiện thông báo lỗi
    if (!error.config?.silent) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;

/** Thông báo lỗi tiếng Việt từ server (nếu có), ngược lại dùng `fallback`. */
export const errorMessage = (error: unknown, fallback: string): string =>
  (axios.isAxiosError(error) && (error.response?.data as { message?: string } | undefined)?.message) || fallback;

/** Mã HTTP của lỗi từ server (undefined nếu không phải lỗi HTTP). */
export const errorStatus = (error: unknown): number | undefined => (axios.isAxiosError(error) ? error.response?.status : undefined);
