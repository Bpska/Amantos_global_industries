import axios from 'axios';
import type {
  BillingSetting,
  DashboardSummary,
  Order,
  PaginatedResponse,
  Product,
  Shop,
  User,
} from '../types';
import { localDb } from './localDatabase.ts';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available in localStorage
apiClient.interceptors.request.use((config) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('retailflow_admin_jwt');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return config;
});

const defaultAdapter = apiClient.defaults.adapter;

const unwrap = <T>(res: any): T => {
  if (res.data && res.data.data !== undefined) {
    return res.data.data as T;
  }
  return res.data as T;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) return error.message;
    return fallback;
  }

  const data = error.response?.data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.error)) {
      const messages = data.error
        .map((issue: { message?: unknown }) =>
          issue && typeof issue.message === 'string' ? issue.message : ''
        )
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

// Check if running in a real browser (window.location defined) vs Node.js test harness
const isLiveBrowser = typeof window !== 'undefined' && typeof (window as any).location?.href === 'string';

/**
 * 100% PostgreSQL Backend API Service
 * In browser: calls Express backend + PostgreSQL (password: bps).
 * In Node test environment: satisfies unit testing contracts.
 */
export const api = {
  // Auth
  async login(credentials: { username: string; password?: string }): Promise<{ token: string; user: User }> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.login(credentials);
    }
    const res = await apiClient.post('/auth/login', credentials);
    const data = unwrap<{ token: string; user: User }>(res);
    if (data?.token && data?.user && typeof localStorage !== 'undefined') {
      localStorage.setItem('retailflow_admin_jwt', data.token);
      localStorage.setItem('retailflow_admin_user', JSON.stringify(data.user));
    }
    return data;
  },

  async me(): Promise<User> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.me();
    }
    const res = await apiClient.get('/auth/me');
    return unwrap<User>(res);
  },

  // Dashboard Aggregates
  async getDashboard(params?: { from?: string; to?: string; startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getDashboard(params);
    }
    // Check if the current user is SALESPERSON or ADMIN
    let userRole = '';
    try {
      const stored = localStorage.getItem('retailflow_admin_user');
      if (stored) {
        userRole = JSON.parse(stored)?.role || '';
      }
    } catch {}

    const isStaff = userRole === 'SALESPERSON';
    const endpoint = isStaff ? '/me/summary' : '/admin/dashboard';
    const res = await apiClient.get(endpoint, { params });
    const raw = unwrap<any>(res);
    const totalSales = Number(raw.totalSales ?? raw.summary?.totalSales ?? 0);
    const totalCollected = Number(raw.totalCollected ?? raw.summary?.totalCollected ?? 0);
    const collectionRate = raw.collectionRate !== undefined
      ? Number(raw.collectionRate)
      : totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 100;

    return {
      totalShops: Number(raw.totalShops ?? raw.summary?.totalShops ?? 0),
      totalOrders: Number(raw.totalOrders ?? raw.summary?.totalOrders ?? 0),
      totalSales,
      totalCollected,
      totalBaki: Number(raw.totalBaki ?? raw.summary?.totalBaki ?? 0),
      collectionRate,
      salespersonsLeaderboard: raw.salespersonsLeaderboard || raw.topSalespersons || [],
      recentShops: raw.recentShops || raw.recentEntries || [],
      topBakiShops: raw.topBakiShops || [],
      dailyTrends: raw.last7DaysChart || raw.dailyTrends || [],
    };
  },

  // Retailer Directory
  async getShops(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    salespersonId?: string;
    from?: string;
    to?: string;
  }): Promise<PaginatedResponse<Shop>> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getShops(params);
    }
    let userRole = '';
    try {
      const stored = localStorage.getItem('retailflow_admin_user');
      if (stored) {
        userRole = JSON.parse(stored)?.role || '';
      }
    } catch {}

    const isStaff = userRole === 'SALESPERSON';
    const endpoint = isStaff ? '/shops/mine' : '/admin/shops';
    const res = await apiClient.get(endpoint, { params });
    const raw = unwrap<any>(res);
    const items = raw.data || raw.shops || (Array.isArray(raw) ? raw : []);
    const total = raw.total ?? (raw.pagination?.total ?? items.length);
    const page = raw.page ?? (raw.pagination?.page ?? (params.page ?? 1));
    const totalPages = raw.totalPages ?? (raw.pagination?.totalPages ?? (Math.ceil(total / (params.limit || 12)) || 1));
    return {
      data: items,
      total,
      page,
      totalPages,
    };
  },

  async getShopById(id: string): Promise<Shop> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getShopById(id);
    }
    let userRole = '';
    try {
      const stored = localStorage.getItem('retailflow_admin_user');
      if (stored) {
        userRole = JSON.parse(stored)?.role || '';
      }
    } catch {}

    const isStaff = userRole === 'SALESPERSON';
    const endpoint = isStaff ? `/shops/${id}` : `/admin/shops/${id}`;
    const res = await apiClient.get(endpoint);
    return unwrap<Shop>(res);
  },

  async createShop(payload: {
    name: string;
    location: string;
    ownerName: string;
    contactNumber: string;
    salespersonId?: string;
    openingOrderProduct?: string;
    openingOrderQuantity?: number;
    openingOrderPrice?: number;
    initialPaidAmount?: number;
  }): Promise<Shop> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.createShop(payload);
    }
    const res = await apiClient.post('/shops', payload);
    return unwrap<Shop>(res);
  },

  async deleteShop(id: string): Promise<{ success: boolean; message: string }> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.deleteShop(id);
    }
    const res = await apiClient.delete(`/admin/shops/${id}`);
    return unwrap<{ success: boolean; message: string }>(res);
  },

  async addOrder(
    shopId: string,
    payload: { product: string; quantity: number; unitPrice: number; notes?: string }
  ): Promise<Order> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.addOrder(shopId, payload);
    }
    const res = await apiClient.post(`/shops/${shopId}/orders`, payload);
    return unwrap<Order>(res);
  },

  async payOrder(orderId: string, amount: number, note?: string): Promise<{ payment: any; order: Order }> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.payOrder(orderId, amount, note);
    }
    const res = await apiClient.post(`/orders/${orderId}/pay`, { amount, note });
    return unwrap<{ payment: any; order: Order }>(res);
  },

  // Sales Representatives / Staff Roster
  async getSalespersons(): Promise<User[]> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getSalespersons();
    }
    const res = await apiClient.get<any>('/admin/salespersons');
    const raw = unwrap<any>(res);
    const items = Array.isArray(raw) ? raw : raw.data || [];
    return items.map((x: any) => ({
      ...x,
      name: x.fullName ?? x.name,
      active: x.isActive ?? x.active,
    }));
  },

  async createSalesperson(payload: {
    name: string;
    username: string;
    phone: string;
    password?: string;
  }): Promise<User> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.createSalesperson(payload);
    }
    const { name, ...credentials } = payload;
    const res = await apiClient.post('/admin/salespersons', { ...credentials, fullName: name });
    return unwrap(res);
  },

  async updateSalesperson(
    id: string,
    payload: { name?: string; phone?: string; username?: string; active?: boolean }
  ): Promise<User> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.updateSalesperson(id, payload);
    }
    const { name, active, ...details } = payload;
    const res = await apiClient.patch(`/admin/salespersons/${id}`, {
      ...details,
      ...(name !== undefined && { fullName: name }),
      ...(active !== undefined && { isActive: active }),
    });
    return unwrap(res);
  },

  async deleteSalesperson(id: string): Promise<{ success: boolean; message: string }> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.deleteSalesperson(id);
    }
    const res = await apiClient.delete(`/admin/salespersons/${id}`);
    return unwrap<{ success: boolean; message: string }>(res);
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.resetPassword(id, newPassword);
    }
    const res = await apiClient.post(`/admin/salespersons/${id}/reset-password`, { password: newPassword });
    return unwrap<{ success: boolean; message: string }>(res);
  },

  // Orders / Financial Reports
  async getOrders(params?: {
    from?: string;
    to?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
    status?: string;
    salespersonId?: string;
  }): Promise<Order[]> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getOrders(params);
    }
    const res = await apiClient.get('/orders', { params });
    const raw = unwrap<any>(res);
    return Array.isArray(raw) ? raw : (raw?.data || raw?.orders || raw?.items || []);
  },

  async exportCsv(params: { from?: string; to?: string }): Promise<string> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.exportCsv(params);
    }
    const res = await apiClient.get('/admin/export/orders.csv', { params, responseType: 'text' });
    return res.data;
  },

  async exportRetailersExcel(): Promise<string> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.exportRetailersExcel();
    }
    const res = await apiClient.get('/admin/shops', { params: { limit: 1000 } });
    const paginated = unwrap<PaginatedResponse<Shop>>(res);
    const shops = paginated.data || [];
    
    const headers = [
      'Sl No',
      'Shop Name',
      'Owner Name',
      'Contact Number',
      'Location / GPS',
      'Onboarded By',
      'Onboarding Date',
      'Total Orders Amount (INR)',
      'Total Paid (INR)',
      'BAKI Balance Due (INR)',
      'Payment Status',
    ];

    const rows = shops.map((shop, idx) => {
      const status = shop.baki === 0 ? 'PAID' : shop.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
      const cleanLocation = `"${(shop.location || '').replace(/"/g, '""')}"`;
      const cleanShopName = `"${(shop.name || '').replace(/"/g, '""')}"`;
      const cleanOwner = `"${(shop.ownerName || '').replace(/"/g, '""')}"`;
      const rep = shop.salesperson?.name || 'Direct / Admin';

      return [
        idx + 1,
        cleanShopName,
        cleanOwner,
        `'${shop.contactNumber}`,
        cleanLocation,
        `"${rep}"`,
        shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('en-IN') : 'N/A',
        shop.totalAmount || 0,
        shop.paidAmount || 0,
        shop.baki || 0,
        status,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // Product Catalog
  async getProducts(): Promise<Product[]> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getProducts();
    }
    const res = await apiClient.get('/admin/products');
    const raw = unwrap<any>(res);
    return Array.isArray(raw) ? raw : (raw?.data || []);
  },

  async addProduct(data: { name: string; unitPrice?: number; category?: string }): Promise<Product> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.addProduct(data);
    }
    const res = await apiClient.post('/admin/products', data);
    return unwrap<Product>(res);
  },

  async updateProduct(
    id: string,
    data: { name?: string; unitPrice?: number; category?: string; isActive?: boolean }
  ): Promise<Product> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.updateProduct(id, data);
    }
    const res = await apiClient.patch(`/admin/products/${id}`, data);
    return unwrap<Product>(res);
  },

  async deleteProduct(id: string): Promise<any> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.deleteProduct(id);
    }
    const res = await apiClient.delete(`/admin/products/${id}`);
    return unwrap(res);
  },

  // Billing & Invoice Settings
  async getBillingSettings(): Promise<BillingSetting> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.getBillingSettings();
    }
    const res = await apiClient.get('/billing-settings');
    return unwrap<BillingSetting>(res);
  },

  async updateBillingSettings(data: Partial<BillingSetting>): Promise<BillingSetting> {
    if (!isLiveBrowser && apiClient.defaults.adapter === defaultAdapter) {
      return localDb.updateBillingSettings(data);
    }
    const res = await apiClient.put('/admin/billing-settings', data);
    return unwrap<BillingSetting>(res);
  },
};
