import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const isBrowser = typeof window !== 'undefined';
const envUrl = process.env.EXPO_PUBLIC_API_URL;
const root = (
  envUrl && !envUrl.includes('localhost')
    ? envUrl
    : isBrowser && window.location.origin
    ? window.location.origin
    : envUrl || 'http://localhost:5000'
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${root}/api/v1`,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((c) => {
  const t = useAuthStore.getState().token;
  if (t) {
    c.headers.Authorization = `Bearer ${t}`;
  }
  return c;
});

api.interceptors.response.use(
  (r) => r,
  async (e) => {
    if (e.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(e);
  }
);

export const unwrap = <T>(r: { data: any }): T => (r.data?.data ?? r.data) as T;
