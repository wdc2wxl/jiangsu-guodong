import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器: 添加 Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 统一响应格式
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface PaginatedData<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 响应拦截器: 处理统一响应格式
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    if (res.code === 0) {
      return res.data;
    }
    message.error(res.message || '请求失败');
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      const msg = error.response.data?.message || '服务器错误';
      message.error(msg);
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error(error.message || '请求失败');
    }
    return Promise.reject(error);
  }
);

export { api };
export type { ApiResponse, PaginatedData };
export default api;
