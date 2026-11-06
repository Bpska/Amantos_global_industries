import axios, { AxiosError } from 'axios';
import type { BillingSetting, DashboardSummary, Order, PaginatedResponse, Product, Shop, User } from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('retailflow_admin_jwt');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('retailflow_admin_jwt');
      localStorage.removeItem('retailflow_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const unwrap = <T>(res: any): T => {
  if (res.data && res.data.data !== undefined) {
    return res.data.data as T;
  }
  return res.data as T;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.error)) {
      const messages = data.error
        .map((issue: { message?: unknown }) => issue && typeof issue.message === 'string' ? issue.message : '')
        .filter(Boolean);
      if (messages.length) return messages.join(' ');
    }
    if (typeof data.message === 'string' && data.message) return data.message;
  }

  if (!error.response || error.response.status >= 500) {
    return 'Cannot reach the sales service. Make sure the backend API is running and try again.';
  }
  return fallback;
};

export const api = {
  // Auth
  async login(credentials: { username: string; password: string }) {
    const res = await apiClient.post<any>('/auth/login', credentials);
    return unwrap<{ token: string; user: User }>(res);
  },

  async me() {
    const res = await apiClient.get<any>('/me');
    return unwrap<User>(res);
  },

  // Dashboard
  async getDashboard(params?: { from?: string; to?: string; startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    const res = await apiClient.get<any>('/admin/dashboard', { params });
    const data = unwrap<any>(res);
    
    // Normalize dashboard response
    const totalSales = Number(data.totalSales || data.sales || 0);
    const totalCollected = Number(data.totalCollected || data.collected || 0);
    const totalBaki = Number(data.totalBaki || data.baki || 0);
    const collectionRate = totalSales > 0 ? Math.min(100, Math.round((totalCollected / totalSales) * 100)) : 100;

    return {
      totalShops: Number(data.totalShops || data.shops || 0),
      totalOrders: Number(data.totalOrders || data.orders || 0),
      totalSales,
      totalCollected,
      totalBaki,
      collectionRate,
      salespersonsLeaderboard: (data.salespersonsLeaderboard || data.salespersons || []).map((x: any) => ({
        ...x,
        totalSales: Number(x.totalSales || x.sales || 0),
        totalCollected: Number(x.totalCollected || x.collected || 0),
        totalBaki: Number(x.totalBaki || x.baki || 0),
      })),
      recentShops: (data.recentShops || []).map((x: any) => ({
        ...x,
        totalAmount: Number(x.totalAmount || x.totalSales || 0),
        paidAmount: Number(x.paidAmount || x.totalCollected || 0),
        baki: Number(x.baki || x.totalBaki || 0),
      })),
      topBakiShops: (data.topBakiShops || []).map((x: any) => ({
        ...x,
        totalAmount: Number(x.totalAmount || x.totalSales || 0),
        paidAmount: Number(x.paidAmount || x.totalCollected || 0),
        baki: Number(x.baki || x.totalBaki || 0),
      })),
      dailyTrends: data.dailyTrends || [],
    };
  },

  // Shops / Retailers
  async getShops(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    salespersonId?: string;
    from?: string;
    to?: string;
  }): Promise<PaginatedResponse<Shop>> {
    const res = await apiClient.get<any>('/admin/shops', { params });
    const raw = unwrap<any>(res);
    const items = Array.isArray(raw) ? raw : raw.data || raw.items || [];
    return {
      data: items.map((x: any) => ({
        ...x,
        totalAmount: Number(x.totalAmount || 0),
        paidAmount: Number(x.paidAmount || 0),
        baki: Number(x.baki || 0),
      })),
      total: raw.total || items.length,
      page: raw.page || 1,
      totalPages: raw.totalPages || Math.ceil((raw.total || items.length) / (params.limit || 15)),
    };
  },

  async getShopById(id: string): Promise<Shop> {
    const res = await apiClient.get<any>(`/admin/shops/${id}`);
    const x = unwrap<any>(res);
    return {
      ...x,
      totalAmount: Number(x.totalAmount || 0),
      paidAmount: Number(x.paidAmount || 0),
      baki: Number(x.baki || 0),
      orders: (x.orders || []).map((o: any) => ({
        ...o,
        totalAmount: Number(o.totalAmount || 0),
        paidAmount: Number(o.paidAmount || 0),
        baki: Number(o.baki || 0),
      })),
    };
  },

  async addOrder(shopId: string, payload: { product: string; quantity: number; unitPrice: number; notes?: string }) {
    const res = await apiClient.post(`/shops/${shopId}/orders`, payload);
    return unwrap(res);
  },

  async payOrder(orderId: string, amount: number, note?: string) {
    const res = await apiClient.post(`/orders/${orderId}/pay`, { amount, note });
    return unwrap(res);
  },

  // Salespersons / Staff
  async getSalespersons(): Promise<User[]> {
    const res = await apiClient.get<any>('/admin/salespersons');
    const raw = unwrap<any>(res);
    const items = Array.isArray(raw) ? raw : raw.data || [];
    return items.map((x: any) => ({
      ...x,
      name: x.fullName ?? x.name,
      active: x.isActive ?? x.active,
      totalShops: Number(x.totalShops || 0),
      totalSales: Number(x.totalSales || 0),
      totalCollected: Number(x.totalCollected || 0),
      totalBaki: Number(x.totalBaki || 0),
    }));
  },

  async createSalesperson(payload: { name: string; username: string; phone: string; password: string }) {
    const { name, ...credentials } = payload;
    const res = await apiClient.post('/admin/salespersons', {
      ...credentials,
      fullName: name,
    });
    return unwrap(res);
  },

  async updateSalesperson(id: string, payload: { name?: string; phone?: string; username?: string; active?: boolean }) {
    const { name, active, ...details } = payload;
    const res = await apiClient.patch(`/admin/salespersons/${id}`, {
      ...details,
      ...(name !== undefined && { fullName: name }),
      ...(active !== undefined && { isActive: active }),
    });
    return unwrap(res);
  },

  async resetPassword(id: string, newPassword: string) {
    const res = await apiClient.post(`/admin/salespersons/${id}/reset-password`, {
      password: newPassword,
      newPassword,
    });
    return unwrap(res);
  },

  // Reports
  async getOrders(params?: { from?: string; to?: string; startDate?: string; endDate?: string; limit?: number; page?: number; status?: string; salespersonId?: string }): Promise<Order[]> {
    const res = await apiClient.get<any>('/admin/orders', { params });
    const raw = unwrap<any>(res);
    const items = Array.isArray(raw) ? raw : (raw.orders || raw.data || raw.items || []);
    return items.map((x: any) => ({
      ...x,
      totalAmount: Number(x.totalAmount || 0),
      paidAmount: Number(x.paidAmount || 0),
      baki: Number(x.baki || 0),
    }));
  },

  async exportCsv(params: { from?: string; to?: string }): Promise<string> {
    const res = await apiClient.get<string>('/admin/export/csv', {
      params,
      responseType: 'text',
    });
    return res.data;
  },

  // Products Catalog
  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<any>('/admin/products');
    const raw = unwrap<any>(res);
    return Array.isArray(raw) ? raw : raw.data || [];
  },

  async addProduct(data: { name: string; unitPrice?: number; category?: string }): Promise<Product> {
    const res = await apiClient.post<any>('/admin/products', data);
    return unwrap<Product>(res);
  },

  async updateProduct(id: string, data: { name?: string; unitPrice?: number; category?: string; isActive?: boolean }): Promise<Product> {
    const res = await apiClient.patch<any>(`/admin/products/${id}`, data);
    return unwrap<Product>(res);
  },

  async deleteProduct(id: string): Promise<any> {
    const res = await apiClient.delete<any>(`/admin/products/${id}`);
    return unwrap(res);
  },

  // Billing Settings
  async getBillingSettings(): Promise<BillingSetting> {
    const res = await apiClient.get<any>('/admin/billing-settings');
    const raw = unwrap<any>(res);
    return raw.data || raw;
  },

  async updateBillingSettings(data: Partial<BillingSetting>): Promise<BillingSetting> {
    const res = await apiClient.put<any>('/admin/billing-settings', data);
    const raw = unwrap<any>(res);
    return raw.data || raw;
  },
};
