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

// Kept for testing adapter injection
const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
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

/**
 * 100% Standalone PWA API Service
 * Operates offline-first using localStorage with pre-seeded data.
 * Zero reliance on external backend or network connection.
 */
export const api = {
  // Auth
  async login(credentials: { username: string; password?: string }): Promise<{ token: string; user: User }> {
    return localDb.login(credentials);
  },

  async me(): Promise<User> {
    return localDb.me();
  },

  // Dashboard Aggregates
  async getDashboard(params?: { from?: string; to?: string; startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    return localDb.getDashboard(params);
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
    return localDb.getShops(params);
  },

  async getShopById(id: string): Promise<Shop> {
    return localDb.getShopById(id);
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
    return localDb.createShop(payload);
  },

  async addOrder(
    shopId: string,
    payload: { product: string; quantity: number; unitPrice: number; notes?: string }
  ): Promise<Order> {
    return localDb.addOrder(shopId, payload);
  },

  async payOrder(orderId: string, amount: number, note?: string): Promise<{ payment: any; order: Order }> {
    return localDb.payOrder(orderId, amount, note);
  },

  // Sales Representatives / Staff Roster
  async getSalespersons(): Promise<User[]> {
    if (apiClient.defaults.adapter !== defaultAdapter) {
      const res = await apiClient.get<any>('/admin/salespersons');
      const raw = unwrap<any>(res);
      const items = Array.isArray(raw) ? raw : raw.data || [];
      return items.map((x: any) => ({
        ...x,
        name: x.fullName ?? x.name,
        active: x.isActive ?? x.active,
      }));
    }
    return localDb.getSalespersons();
  },

  async createSalesperson(payload: {
    name: string;
    username: string;
    phone: string;
    password?: string;
  }): Promise<User> {
    if (apiClient.defaults.adapter !== defaultAdapter) {
      const { name, ...credentials } = payload;
      const res = await apiClient.post('/admin/salespersons', { ...credentials, fullName: name });
      return unwrap(res);
    }
    return localDb.createSalesperson(payload);
  },

  async updateSalesperson(
    id: string,
    payload: { name?: string; phone?: string; username?: string; active?: boolean }
  ): Promise<User> {
    if (apiClient.defaults.adapter !== defaultAdapter) {
      const { name, active, ...details } = payload;
      const res = await apiClient.patch(`/admin/salespersons/${id}`, {
        ...details,
        ...(name !== undefined && { fullName: name }),
        ...(active !== undefined && { isActive: active }),
      });
      return unwrap(res);
    }
    return localDb.updateSalesperson(id, payload);
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    return localDb.resetPassword(id, newPassword);
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
    return localDb.getOrders(params);
  },

  async exportCsv(params: { from?: string; to?: string }): Promise<string> {
    return localDb.exportCsv(params);
  },

  // Product Catalog
  async getProducts(): Promise<Product[]> {
    return localDb.getProducts();
  },

  async addProduct(data: { name: string; unitPrice?: number; category?: string }): Promise<Product> {
    return localDb.addProduct(data);
  },

  async updateProduct(
    id: string,
    data: { name?: string; unitPrice?: number; category?: string; isActive?: boolean }
  ): Promise<Product> {
    return localDb.updateProduct(id, data);
  },

  async deleteProduct(id: string): Promise<any> {
    return localDb.deleteProduct(id);
  },

  // Billing & Invoice Settings
  async getBillingSettings(): Promise<BillingSetting> {
    return localDb.getBillingSettings();
  },

  async updateBillingSettings(data: Partial<BillingSetting>): Promise<BillingSetting> {
    return localDb.updateBillingSettings(data);
  },
};
