import { api, unwrap } from './client';
import type { Dashboard, Order, Page, Shop, ShopInput, Summary, User } from '@/types';

type PaymentResult = { order: Order; shop?: Shop };

function normalizeShop(s: any): Shop {
  const totalAmount = Number(s.totalAmount ?? s.summary?.totalSales ?? 0);
  const paidAmount = Number(s.paidAmount ?? s.summary?.totalCollected ?? 0);
  const baki = Number(s.baki ?? s.summary?.totalBaki ?? Math.max(0, totalAmount - paidAmount));
  const status = s.status || (baki === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'));

  return {
    id: s.id,
    name: s.name || s.shopName || 'Unknown Shop',
    ownerName: s.ownerName || '',
    contactNumber: s.contactNumber || '',
    location: s.location || '',
    createdAt: s.createdAt || new Date().toISOString(),
    totalAmount,
    paidAmount,
    baki,
    status,
    salesperson: s.salesperson || (s.createdBy ? {
      id: s.createdBy.id,
      name: s.createdBy.fullName || s.createdBy.name,
      username: s.createdBy.username,
      phone: s.createdBy.phone,
      role: s.createdBy.role || 'SALESPERSON',
      active: s.createdBy.isActive ?? true,
    } : undefined),
    orders: Array.isArray(s.orders) ? s.orders.map(normalizeOrder) : undefined,
  };
}

function normalizeOrder(o: any): Order {
  const totalAmount = Number(o.totalAmount ?? 0);
  const paidAmount = Number(o.paidAmount ?? o.amountPaid ?? 0);
  const baki = Number(o.baki ?? o.balanceDue ?? Math.max(0, totalAmount - paidAmount));

  return {
    id: o.id,
    invoiceNumber: o.invoiceNumber,
    billingType: o.billingType || 'ONLINE',
    product: o.product || o.productName || 'Mixture Pack',
    quantity: Number(o.quantity ?? 1),
    unitPrice: Number(o.unitPrice ?? 0),
    totalAmount,
    paidAmount,
    baki,
    date: o.date || o.visitDate || o.createdAt || new Date().toISOString(),
    notes: o.notes || undefined,
    payments: Array.isArray(o.payments)
      ? o.payments.map((p: any) => ({
          id: p.id,
          amount: Number(p.amount ?? 0),
          createdAt: p.createdAt || p.paidOn || new Date().toISOString(),
          note: p.note || undefined,
        }))
      : undefined,
  };
}

function normalizeUser(u: any): User {
  return {
    id: u.id,
    name: u.name || u.fullName || u.username,
    username: u.username,
    phone: u.phone || undefined,
    role: u.role,
    active: u.active ?? u.isActive ?? true,
  };
}

function normalizePage<T>(raw: any, normalizer: (x: any) => T): Page<T> {
  const items = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.shops) ? raw.shops : Array.isArray(raw?.orders) ? raw.orders : Array.isArray(raw) ? raw : [];
  const normalizedItems = items.map(normalizer);
  const page = raw?.pagination?.page ?? raw?.page ?? 1;
  const totalPages = raw?.pagination?.totalPages ?? raw?.totalPages ?? 1;
  const total = raw?.pagination?.total ?? raw?.total ?? normalizedItems.length;

  return {
    data: normalizedItems,
    page,
    totalPages,
    total,
    nextPage: page < totalPages ? page + 1 : undefined,
  };
}

export const authApi = {
  login: async (input: { username: string; password: string }) => {
    const res = await api.post('/auth/login', input);
    const data = unwrap<{ token: string; user: any }>(res);
    return {
      token: data.token,
      user: normalizeUser(data.user),
    };
  },

  me: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    const data = unwrap<any>(res);
    return normalizeUser(data);
  },

};

export const salesApi = {
  summary: async (): Promise<Summary> => {
    const res = await api.get('/me/summary');
    const d = unwrap<any>(res);
    return {
      totalShops: d.totalShops ?? d.shopsCount ?? 0,
      totalOrders: d.totalOrders ?? d.ordersCount ?? 0,
      totalSales: d.totalSales ?? 0,
      totalCollected: d.totalCollected ?? 0,
      totalBaki: d.totalBaki ?? 0,
      todayVisits: d.todayVisits ?? d.today?.ordersCount ?? 0,
      todaySales: d.todaySales ?? d.today?.sales ?? 0,
      todayCollected: d.todayCollected ?? d.today?.collected ?? 0,
      todayBaki: d.todayBaki ?? d.today?.baki ?? 0,
      recentEntries: Array.isArray(d.recentEntries) ? d.recentEntries.map(normalizeShop) : [],
    };
  },

  createShop: async (input: ShopInput): Promise<Shop> => {
    const paymentNote = input.paymentMethod ? `[Method: ${input.paymentMethod}]` : '';
    const combinedNotes = [paymentNote, input.notes].filter(Boolean).join(' - ') || undefined;

    const payload = {
      shopName: input.name,
      name: input.name,
      location: input.location,
      ownerName: input.ownerName,
      contactNumber: input.contactNumber,
      productName: input.product,
      product: input.product,
      quantity: Number(input.quantity),
      unitPrice: Number(input.unitPrice),
      amountPaid: Number(input.amountPaid || 0),
      billingType: input.billingType || 'ONLINE',
      visitDate: input.date,
      date: input.date,
      notes: combinedNotes,
    };

    const res = await api.post('/shops', payload);
    const data = unwrap<any>(res);
    return normalizeShop(data.shop || data);
  },

  myShops: async (params: any): Promise<Page<Shop>> => {
    const res = await api.get('/shops/mine', { params });
    const raw = unwrap<any>(res);
    return normalizePage(raw, normalizeShop);
  },

  shop: async (id: string): Promise<Shop> => {
    const res = await api.get(`/shops/${id}`);
    return normalizeShop(unwrap(res));
  },

  addOrder: async (id: string, input: any): Promise<Order> => {
    const payload = {
      productName: input.product || input.productName || 'Mixture Pack',
      product: input.product || input.productName || 'Mixture Pack',
      quantity: Number(input.quantity || 1),
      unitPrice: Number(input.unitPrice || 0),
      amountPaid: Number(input.amountPaid || 0),
      billingType: input.billingType || 'ONLINE',
      visitDate: input.date || input.visitDate || new Date().toISOString(),
      date: input.date || input.visitDate || new Date().toISOString(),
      notes: input.notes,
    };

    const res = await api.post(`/shops/${id}/orders`, payload);
    const data = unwrap<any>(res);
    return normalizeOrder(data);
  },

  pay: async (id: string, amount: number, note?: string): Promise<PaymentResult> => {
    const res = await api.post(`/orders/${id}/payments`, { amount, note });
    const data = unwrap<any>(res);
    return {
      order: normalizeOrder(data.order || data),
      shop: data.shop ? normalizeShop(data.shop) : undefined,
    };
  },

  products: async (): Promise<Array<{ id: string; name: string; unitPrice: number; category: string }>> => {
    const res = await api.get('/products');
    const data = unwrap<any>(res);
    return Array.isArray(data) ? data : data.data || [];
  },

  billingSettings: async (): Promise<{
    businessName: string;
    tagline?: string;
    phone?: string;
    address?: string;
    terms?: string;
    logoUrl?: string;
  }> => {
    const res = await api.get('/billing-settings');
    const data = unwrap<any>(res);
    return data.data || data;
  },
};

export const adminApi = {
  dashboard: async (): Promise<Dashboard> => {
    const res = await api.get('/admin/dashboard');
    const d = unwrap<any>(res);
    return {
      totalShops: d.totalShops ?? d.summary?.totalShops ?? 0,
      totalOrders: d.totalOrders ?? d.summary?.totalOrders ?? 0,
      totalSales: d.totalSales ?? d.summary?.totalSales ?? 0,
      totalCollected: d.totalCollected ?? d.summary?.totalCollected ?? 0,
      totalBaki: d.totalBaki ?? d.summary?.totalBaki ?? 0,
      todayVisits: d.todayVisits ?? d.today?.ordersCount ?? 0,
      todaySales: d.todaySales ?? d.today?.totalSales ?? 0,
      todayCollected: d.todayCollected ?? d.today?.collected ?? 0,
      todayBaki: d.todayBaki ?? d.today?.baki ?? 0,
      sevenDaySales: Array.isArray(d.sevenDaySales)
        ? d.sevenDaySales
        : Array.isArray(d.last7DaysChart)
        ? d.last7DaysChart.map((c: any) => ({ date: c.date, amount: c.sales ?? c.amount ?? 0 }))
        : [],
      topSalespersons: Array.isArray(d.topSalespersons)
        ? d.topSalespersons.map((sp: any) => ({
            ...normalizeUser(sp),
            totalShops: sp.totalShops ?? sp.shopsCount ?? 0,
            totalSales: sp.totalSales ?? 0,
            totalCollected: sp.totalCollected ?? sp.collected ?? 0,
            totalBaki: sp.totalBaki ?? sp.baki ?? 0,
          }))
        : [],
      topBakiShops: Array.isArray(d.topBakiShops)
        ? d.topBakiShops.map((s: any) => ({
            ...normalizeShop(s),
            baki: s.baki ?? s.totalBaki ?? 0,
          }))
        : [],
    };
  },

  shops: async (params: any): Promise<Page<Shop>> => {
    const res = await api.get('/admin/shops', { params });
    const raw = unwrap<any>(res);
    return normalizePage(raw, normalizeShop);
  },

  shop: async (id: string): Promise<Shop> => {
    const res = await api.get(`/admin/shops/${id}`);
    return normalizeShop(unwrap(res));
  },

  orders: async (params: any): Promise<Page<Order>> => {
    const res = await api.get('/admin/orders', { params });
    const raw = unwrap<any>(res);
    return normalizePage(raw, normalizeOrder);
  },

  salespersons: async (params?: any): Promise<Page<User>> => {
    const res = await api.get('/admin/salespersons', { params });
    const raw = unwrap<any>(res);
    return normalizePage(raw, (u: any) => ({
      ...normalizeUser(u),
      totalShops: u.totalShops ?? u.totals?.shopsOnboarded ?? 0,
      totalSales: u.totalSales ?? u.totals?.salesAmount ?? 0,
      totalCollected: u.totalCollected ?? u.totals?.collected ?? 0,
      totalBaki: u.totalBaki ?? u.totals?.baki ?? 0,
    }));
  },

  createSalesperson: async (input: any): Promise<User> => {
    const payload = {
      username: input.username,
      password: input.password,
      fullName: input.name || input.fullName,
      phone: input.phone,
    };

    const res = await api.post('/admin/salespersons', payload);
    return normalizeUser(unwrap(res));
  },

  updateSalesperson: async (id: string, input: any): Promise<User> => {
    const payload = {
      fullName: input.name !== undefined ? input.name : input.fullName,
      phone: input.phone,
      isActive: input.active !== undefined ? input.active : input.isActive,
    };

    const res = await api.patch(`/admin/salespersons/${id}`, payload);
    return normalizeUser(unwrap(res));
  },

  resetPassword: async (id: string, password: string) => {
    const res = await api.post(`/admin/salespersons/${id}/reset-password`, { password });
    return unwrap(res);
  },

  exportCsv: async (params: any): Promise<string> => {
    const res = await api.get('/admin/export/orders.csv', { params, responseType: 'text' });
    return res.data as string;
  },
};
