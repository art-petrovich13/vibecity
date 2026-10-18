import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) return message;

    const details = error.response?.data?.details;
    if (details && typeof details === 'object') {
      const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
      if (fieldErrors) {
        const first = Object.values(fieldErrors).flat()[0];
        if (first) return first;
      }
    }

    if (error.code === 'ECONNABORTED') return 'Сервер отвечает слишком долго. Попробуйте ещё раз';
    if (!error.response) return 'Не удалось связаться с сервером. Проверьте подключение';
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return 'Что-то пошло не так. Попробуйте ещё раз';
};
