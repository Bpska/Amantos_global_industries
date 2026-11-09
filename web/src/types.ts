export type Role = 'ADMIN' | 'SALESPERSON';

export interface User {
  id: string;
  username: string;
  name: string;
  phone?: string;
  password?: string;
  role: Role;
  active?: boolean;
  totalShops?: number;
  totalSales?: number;
  totalCollected?: number;
  totalBaki?: number;
  ordersCount?: number;
  storesVisited?: number;
  totalVisits?: number;
  todayVisits?: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  invoiceNumber?: string;
  shopId: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  baki: number;
  paymentMethod?: string;
  billingType?: 'ONLINE' | 'PHYSICAL';
  date: string;
  notes?: string;
  salespersonId?: string;
  salesperson?: {
    id: string;
    name: string;
    username: string;
    phone?: string;
  };
  shop?: {
    id: string;
    name: string;
    ownerName: string;
    contactNumber: string;
    location: string;
  };
  payments?: Payment[];
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  contactNumber: string;
  salespersonId: string;
  createdAt: string;
  totalAmount: number;
  paidAmount: number;
  baki: number;
  salesperson?: {
    id: string;
    name: string;
    username: string;
    phone?: string;
  };
  orders?: Order[];
}

export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface BillingSetting {
  id?: string;
  businessName: string;
  tagline?: string;
  phone?: string;
  address?: string;
  terms?: string;
  logoUrl?: string;
  gstin?: string;
}

export interface DashboardSummary {
  totalShops: number;
  totalOrders: number;
  totalSales: number;
  totalCollected: number;
  totalBaki: number;
  collectionRate: number;
  salespersonsLeaderboard: User[];
  recentShops: Shop[];
  topBakiShops: Shop[];
  dailyTrends?: { date: string; sales: number; collected: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

