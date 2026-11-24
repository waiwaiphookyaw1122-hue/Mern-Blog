import axios from 'axios';
import { useSession } from '../stores/session';

export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

const serverOrigin = API_URL.replace(/\/api$/, '');

export const imageUrl = (file) =>
  file ? `${serverOrigin}/uploads/${encodeURIComponent(file)}` : '';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const { token } = useSession.getState();
  if (token && config.authenticated) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message;
    const status = err.response?.status;
    if (
      err.config?.authenticated &&
      (status === 402 ||
        (status === 403 && msg === 'Unauthorized. Invalid token.'))
    ) {
      useSession.getState().expire();
    }
    return Promise.reject(err);
  },
);