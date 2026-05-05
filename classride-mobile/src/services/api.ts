import axios from 'axios';
import { storage } from './storage';

const IS_PRODUCTION = true; // set to false for local development
const BASE_URL = IS_PRODUCTION
? 'https://classride-intelligent.onrender.com'
  : 'http://192.168.1.103:3001';const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        const phoneNumber = await storage.getItem('phoneNumber');

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          phoneNumber,
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await storage.setItem('accessToken', accessToken);
        await storage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        await storage.removeItem('accessToken');
        await storage.removeItem('refreshToken');
        await storage.removeItem('phoneNumber');
        await storage.removeItem('role');
      }
    }

    return Promise.reject(error);
  }
);

export default api;