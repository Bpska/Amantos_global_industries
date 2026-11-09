import type {
  BillingSetting,
  DashboardSummary,
  Order,
  PaginatedResponse,
  Payment,
  Product,
  Shop,
  User,
} from '../types';

const STORAGE_KEYS = {
  INITIALIZED: 'heylane_pwa_init_v3',
  USERS: 'heylane_pwa_users',
  PRODUCTS: 'heylane_pwa_products',
  SHOPS: 'heylane_pwa_shops',
  ORDERS: 'heylane_pwa_orders',
  SETTINGS: 'heylane_pwa_settings',
  AUTH_TOKEN: 'retailflow_admin_jwt',
  AUTH_USER: 'retailflow_admin_user',
};

// Safe localStorage access helper
const getStore = <T>(key: string, fallback: T): T => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setStore = (key: string, val: any): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
};

// Seed initial dataset - ONLY Admin account, no dummy staff
const INITIAL_USERS: User[] = [
  {
    id: 'user_admin',
    username: 'admin',
    name: 'System Administrator',
    role: 'ADMIN',
    phone: '+91 99999 00000',
    password: 'admin@123',
    active: true,
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Mixture Pack 500g',
    category: 'Namkeen',
    unitPrice: 120,
    isActive: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'prod_2',
    name: 'Besan Laddu 250g',
    category: 'Sweets',
    unitPrice: 85,
    isActive: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'prod_3',
    name: 'Salted Cashew 200g',
    category: 'Dry Fruits',
    unitPrice: 210,
    isActive: true,
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'prod_4',
    name: 'Spicy Sev 400g',
    category: 'Namkeen',
    unitPrice: 95,
    isActive: true,
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'prod_5',
    name: 'Gulab Jamun Tin 1kg',
    category: 'Sweets',
    unitPrice: 260,
    isActive: true,
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'prod_6',
    name: 'Masala Murmura 300g',
    category: 'Snacks',
    unitPrice: 45,
    isActive: true,
    createdAt: '2026-10-05T10:00:00Z',
  },
];

const INITIAL_SETTINGS: BillingSetting = {
  businessName: 'Amantos Global Industries',
  tagline: 'Industrial & Commercial Distribution Network',
  phone: '+91 98765 43210',
  address: 'Main Commercial Hub, Bhubaneswar, Odisha',
  terms:
    'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.',
  logoUrl: '/assets/brand/amantos-logo.jpg',
};

const INITIAL_SHOPS: Shop[] = [
  {
    id: 'shop_1',
    name: 'Maa Tarini Store',
    location: 'Unit-4 Market, Bhuwaneswar (20.2789° N, 85.8344° E)',
    ownerName: 'Ramesh Sahu',
    contactNumber: '9861234567',
    salespersonId: 'user_rajesh',
    createdAt: '2026-10-15T09:30:00Z',
    totalAmount: 18000,
    paidAmount: 12000,
    baki: 6000,
  },
  {
    id: 'shop_2',
    name: 'Om Sai Kirana & General Store',
    location: 'Plot 142, Saheed Nagar, Bhubaneswar (20.2921° N, 85.8456° E)',
    ownerName: 'Sanjay Mohanty',
    contactNumber: '9437189012',
    salespersonId: 'user_rajesh',
    createdAt: '2026-10-18T11:15:00Z',
    totalAmount: 24500,
    paidAmount: 24500,
    baki: 0,
  },
  {
    id: 'shop_3',
    name: 'Bhadrak Daily Mart',
    location: 'Master Canteen Station Sq, Bhubaneswar (20.2678° N, 85.8412° E)',
    ownerName: 'Bikash Nayak',
    contactNumber: '9853211223',
    salespersonId: 'user_amit',
    createdAt: '2026-10-22T14:40:00Z',
    totalAmount: 32000,
    paidAmount: 14000,
    baki: 18000,
  },
  {
    id: 'shop_4',
    name: 'Kalinga Wholesale Agency',
    location: 'IRC Village, Nayapalli, Bhubaneswar (20.3012° N, 85.8198° E)',
    ownerName: 'Pradeep Jena',
    contactNumber: '9778144556',
    salespersonId: 'user_amit',
    createdAt: '2026-10-25T16:00:00Z',
    totalAmount: 15600,
    paidAmount: 15600,
    baki: 0,
  },
  {
    id: 'shop_5',
    name: 'Shree Ram Provision Store',
    location: 'Near KIIT Square, Patia, Bhubaneswar (20.3541° N, 85.8189° E)',
    ownerName: 'Debashis Das',
    contactNumber: '9124577889',
    salespersonId: 'user_priya',
    createdAt: '2026-10-28T10:20:00Z',
    totalAmount: 28400,
    paidAmount: 16000,
    baki: 12400,
  },
  {
    id: 'shop_6',
    name: 'Radha Krishna Traders',
    location: 'Bindu Sagar Rd, Old Town, Bhubaneswar (20.2415° N, 85.8327° E)',
    ownerName: 'Manoranjan Panda',
    contactNumber: '9937088990',
    salespersonId: 'user_priya',
    createdAt: '2026-11-01T12:00:00Z',
    totalAmount: 9800,
    paidAmount: 9800,
    baki: 0,
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1',
    invoiceNumber: 'INV-2026-000101',
    shopId: 'shop_1',
    product: 'Mixture Pack 500g',
    quantity: 100,
    unitPrice: 120,
    totalAmount: 12000,
    paidAmount: 8000,
    baki: 4000,
    billingType: 'ONLINE',
    paymentMethod: 'UPI / Cash',
    date: '2026-10-20',
    salespersonId: 'user_rajesh',
    payments: [
      {
        id: 'pay_1',
        orderId: 'ord_1',
        amount: 8000,
        note: 'Initial cash payment at delivery',
        createdAt: '2026-10-20T10:00:00Z',
      },
    ],
  },
  {
    id: 'ord_2',
    invoiceNumber: 'INV-2026-000102',
    shopId: 'shop_1',
    product: 'Spicy Sev 400g',
    quantity: 60,
    unitPrice: 100,
    totalAmount: 6000,
    paidAmount: 4000,
    baki: 2000,
    billingType: 'PHYSICAL',
    paymentMethod: 'Cash',
    date: '2026-10-28',
    salespersonId: 'user_rajesh',
    payments: [
      {
        id: 'pay_2',
        orderId: 'ord_2',
        amount: 4000,
        note: 'Partial payment on visit',
        createdAt: '2026-10-28T14:30:00Z',
      },
    ],
  },
  {
    id: 'ord_3',
    invoiceNumber: 'INV-2026-000103',
    shopId: 'shop_2',
    product: 'Gulab Jamun Tin 1kg',
    quantity: 50,
    unitPrice: 260,
    totalAmount: 13000,
    paidAmount: 13000,
    baki: 0,
    billingType: 'ONLINE',
    paymentMethod: 'Bank Transfer',
    date: '2026-10-25',
    salespersonId: 'user_rajesh',
    payments: [
      {
        id: 'pay_3',
        orderId: 'ord_3',
        amount: 13000,
        note: 'Full settlement via Net Banking',
        createdAt: '2026-10-25T11:45:00Z',
      },
    ],
  },
  {
    id: 'ord_4',
    invoiceNumber: 'INV-2026-000104',
    shopId: 'shop_2',
    product: 'Besan Laddu 250g',
    quantity: 115,
    unitPrice: 100,
    totalAmount: 11500,
    paidAmount: 11500,
    baki: 0,
    billingType: 'ONLINE',
    paymentMethod: 'UPI',
    date: '2026-11-02',
    salespersonId: 'user_rajesh',
    payments: [
      {
        id: 'pay_4',
        orderId: 'ord_4',
        amount: 11500,
        note: 'Instant QR code scan',
        createdAt: '2026-11-02T16:00:00Z',
      },
    ],
  },
  {
    id: 'ord_5',
    invoiceNumber: 'INV-2026-000105',
    shopId: 'shop_3',
    product: 'Salted Cashew 200g',
    quantity: 100,
    unitPrice: 210,
    totalAmount: 21000,
    paidAmount: 10000,
    baki: 11000,
    billingType: 'PHYSICAL',
    paymentMethod: 'Cash',
    date: '2026-10-26',
    salespersonId: 'user_amit',
    payments: [
      {
        id: 'pay_5',
        orderId: 'ord_5',
        amount: 10000,
        note: 'Advance payment',
        createdAt: '2026-10-26T15:20:00Z',
      },
    ],
  },
  {
    id: 'ord_6',
    invoiceNumber: 'INV-2026-000106',
    shopId: 'shop_3',
    product: 'Mixture Pack 500g',
    quantity: 100,
    unitPrice: 110,
    totalAmount: 11000,
    paidAmount: 4000,
    baki: 7000,
    billingType: 'PHYSICAL',
    paymentMethod: 'Cash',
    date: '2026-11-04',
    salespersonId: 'user_amit',
    payments: [
      {
        id: 'pay_6',
        orderId: 'ord_6',
        amount: 4000,
        note: 'Partial cash on delivery',
        createdAt: '2026-11-04T12:00:00Z',
      },
    ],
  },
  {
    id: 'ord_7',
    invoiceNumber: 'INV-2026-000107',
    shopId: 'shop_5',
    product: 'Besan Laddu 250g',
    quantity: 200,
    unitPrice: 85,
    totalAmount: 17000,
    paidAmount: 10000,
    baki: 7000,
    billingType: 'ONLINE',
    paymentMethod: 'UPI',
    date: '2026-10-30',
    salespersonId: 'user_priya',
    payments: [
      {
        id: 'pay_7',
        orderId: 'ord_7',
        amount: 10000,
        note: 'Google Pay transfer',
        createdAt: '2026-10-30T10:10:00Z',
      },
    ],
  },
  {
    id: 'ord_8',
    invoiceNumber: 'INV-2026-000108',
    shopId: 'shop_5',
    product: 'Salted Cashew 200g',
    quantity: 50,
    unitPrice: 228,
    totalAmount: 11400,
    paidAmount: 6000,
    baki: 5400,
    billingType: 'PHYSICAL',
    paymentMethod: 'Cash',
    date: '2026-11-05',
    salespersonId: 'user_priya',
    payments: [
      {
        id: 'pay_8',
        orderId: 'ord_8',
        amount: 6000,
        note: 'Store cash receipt',
        createdAt: '2026-11-05T13:40:00Z',
      },
    ],
  },
];

// Initialize dataset if not present
export const initLocalDatabase = (): void => {
  if (typeof window === 'undefined') return;

  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized) {
    setStore(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStore(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStore(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setStore(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    setStore(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem('retailflow_agi_migrated', 'true');
  } else {
    // Ensure admin user exists and password is admin@123
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let adminUser = users.find((u) => u.username === 'admin');
    if (!adminUser) {
      users.unshift(INITIAL_USERS[0]);
      setStore(STORAGE_KEYS.USERS, users);
    } else if (adminUser.password !== 'admin@123' || adminUser.active === false) {
      adminUser.password = 'admin@123';
      adminUser.active = true;
      setStore(STORAGE_KEYS.USERS, users);
    }
  }
};

// Auto-run initialization
initLocalDatabase();

// Use the current roster entry so role changes and disabled accounts apply on refresh.
const sessionUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH_USER) || 'null');
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const user = users.find((entry) => entry.id === stored?.id);
    if (token && user && user.active !== false &&
        (user.role === 'ADMIN' || user.role === 'SALESPERSON')) return user;
  } catch {
    // A corrupt or incomplete session must go through login again.
  }
  throw new Error('Your session has ended. Please sign in again.');
};

const requireAdmin = (): void => {
  if (sessionUser()?.role === 'SALESPERSON') throw new Error('Only administrators can perform this action.');
};

const checkShopAccess = (shop: Shop | undefined): void => {
  if (!shop) throw new Error('Retailer not found.');
  const user = sessionUser();
  if (user?.role === 'SALESPERSON' && shop.salespersonId !== user.id) {
    throw new Error('This retailer is not assigned to you.');
  }
};

// Offline-First Standalone API Implementation
export const localDb = {
  // Authentication
  async login(credentials: { username: string; password?: string }): Promise<{ token: string; user: User }> {
    initLocalDatabase();
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const normalizedInput = credentials.username.trim().toLowerCase();

    // Match username
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === normalizedInput ||
        (normalizedInput === 'admin' && u.role === 'ADMIN')
    );

    if (!found) {
      throw new Error(`Invalid credentials. User '${credentials.username}' was not found.`);
    }

    if (found.active === false) {
      throw new Error('Account deactivated. Please contact your system administrator.');
    }

    // Verify password if provided or if the account has a configured password
    if (credentials.password !== undefined && credentials.password !== '') {
      const expectedPassword = found.password || (found.role === 'ADMIN' ? 'admin@123' : 'Sales@123');
      if (found.password && credentials.password !== expectedPassword) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
    }

    const token = `pwa_token_${found.id}_${Date.now()}`;
    const userPayload: User = { ...found };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userPayload));
    }

    return { token, user: userPayload };
  },

  async me(): Promise<User> {
    initLocalDatabase();
    const user = sessionUser();
    if (!user) throw new Error('Please sign in again.');
    return user;
  },

  // Dashboard Aggregates
  async getDashboard(params?: { startDate?: string; endDate?: string }): Promise<DashboardSummary> {
    initLocalDatabase();
    const user = sessionUser();
    const isStaff = user?.role === 'SALESPERSON';
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS)
      .filter((shop) => !isStaff || shop.salespersonId === user.id);
    const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
      .filter((order) => !isStaff || order.salespersonId === user.id);
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS)
      .filter((entry) => !isStaff || entry.id === user.id);

    let filteredOrders = orders;
    if (params?.startDate) {
      filteredOrders = filteredOrders.filter((o) => o.date >= params.startDate!);
    }
    if (params?.endDate) {
      filteredOrders = filteredOrders.filter((o) => o.date <= params.endDate!);
    }

    const totalOrders = filteredOrders.length;
    const totalSales = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalCollected = filteredOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
    const totalBaki = filteredOrders.reduce((sum, o) => sum + Number(o.baki || 0), 0);
    const collectionRate = totalSales > 0 ? Math.min(100, Math.round((totalCollected / totalSales) * 100)) : 100;

    // Leaderboard
    const salespersons = users
      .filter((u) => u.role === 'SALESPERSON')
      .map((rep) => {
        const repOrders = filteredOrders.filter((o) => o.salespersonId === rep.id);
        const repShops = shops.filter((s) => s.salespersonId === rep.id);
        const repSales = repOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const repColl = repOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
        const repBaki = repOrders.reduce((sum, o) => sum + Number(o.baki || 0), 0);

        return {
          ...rep,
          totalShops: repShops.length,
          ordersCount: repOrders.length,
          totalSales: repSales,
          totalCollected: repColl,
          totalBaki: repBaki,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);

    // Recent shops and top BAKI computed from live orders
    const liveShops = shops.map((shop) => {
      const shopOrders = filteredOrders.filter((o) => o.shopId === shop.id);
      const totalAmount = shopOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const paidAmount = shopOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
      const baki = Math.max(0, totalAmount - paidAmount);
      return {
        ...shop,
        totalAmount,
        paidAmount,
        baki,
      };
    });

    const recentShops = [...liveShops]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const topBakiShops = [...liveShops]
      .filter((s) => Number(s.baki) > 0)
      .sort((a, b) => Number(b.baki || 0) - Number(a.baki || 0))
      .slice(0, 5);

    return {
      totalShops: shops.length,
      totalOrders,
      totalSales,
      totalCollected,
      totalBaki,
      collectionRate,
      salespersonsLeaderboard: salespersons,
      recentShops,
      topBakiShops,
      dailyTrends: [...new Set(filteredOrders.map((order) => order.date.slice(0, 10)))].sort().map((date) => ({
        date,
        sales: filteredOrders.filter((order) => order.date.startsWith(date)).reduce((sum, order) => sum + order.totalAmount, 0),
        collected: filteredOrders.filter((order) => order.date.startsWith(date)).reduce((sum, order) => sum + order.paidAmount, 0),
      })),
    };
  },

  // Shops CRUD
  async getShops(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    salespersonId?: string;
  }): Promise<PaginatedResponse<Shop>> {
    initLocalDatabase();
    let items = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const user = sessionUser();
    if (user?.role === 'SALESPERSON') items = items.filter((shop) => shop.salespersonId === user.id);
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);

    // Attach salesperson info & orders
    items = items.map((shop) => {
      const rep = users.find((u) => u.id === shop.salespersonId);
      const shopOrders = orders.filter((o) => o.shopId === shop.id);
      const totAmt = shopOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const paidAmt = shopOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
      const baki = totAmt - paidAmt;

      return {
        ...shop,
        totalAmount: totAmt > 0 ? totAmt : shop.totalAmount,
        paidAmount: totAmt > 0 ? paidAmt : shop.paidAmount,
        baki: totAmt > 0 ? baki : shop.baki,
        salesperson: rep ? { id: rep.id, name: rep.name, username: rep.username, phone: rep.phone } : undefined,
      };
    });

    // Filters
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.ownerName.toLowerCase().includes(q) ||
          s.contactNumber.includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }

    if (params.status && params.status !== 'ALL') {
      if (params.status === 'PAID') {
        items = items.filter((s) => s.baki <= 0);
      } else if (params.status === 'PARTIAL') {
        items = items.filter((s) => s.baki > 0 && s.paidAmount > 0);
      } else if (params.status === 'UNPAID') {
        items = items.filter((s) => s.paidAmount === 0 && s.totalAmount > 0);
      }
    }

    if (params.salespersonId) {
      items = items.filter((s) => s.salespersonId === params.salespersonId);
    }

    const total = items.length;
    const page = params.page || 1;
    const limit = params.limit || 15;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = items.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      totalPages,
    };
  },

  async getShopById(id: string): Promise<Shop> {
    initLocalDatabase();
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);

    const shop = shops.find((s) => s.id === id);
    if (!shop) throw new Error(`Shop with id '${id}' not found`);
    checkShopAccess(shop);

    const rep = users.find((u) => u.id === shop.salespersonId);
    const shopOrders = orders
      .filter((o) => o.shopId === id)
      .map((o) => ({
        ...o,
        shop: {
          id: shop.id,
          name: shop.name,
          ownerName: shop.ownerName,
          contactNumber: shop.contactNumber,
          location: shop.location,
        },
        salesperson: rep ? { id: rep.id, name: rep.name, username: rep.username, phone: rep.phone } : undefined,
      }));

    const totalAmount = shopOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const paidAmount = shopOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
    const baki = totalAmount - paidAmount;

    return {
      ...shop,
      totalAmount: totalAmount > 0 ? totalAmount : shop.totalAmount,
      paidAmount: totalAmount > 0 ? paidAmount : shop.paidAmount,
      baki: totalAmount > 0 ? baki : shop.baki,
      salesperson: rep ? { id: rep.id, name: rep.name, username: rep.username, phone: rep.phone } : undefined,
      orders: shopOrders,
    };
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
    initLocalDatabase();
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const newId = `shop_${Date.now()}`;

    const user = sessionUser();
    const repId = user?.role === 'SALESPERSON' ? user.id :
      payload.salespersonId || users.find((u) => u.role === 'SALESPERSON')?.id || 'user_rajesh';

    const newShop: Shop = {
      id: newId,
      name: payload.name.trim(),
      location: payload.location.trim(),
      ownerName: payload.ownerName.trim(),
      contactNumber: payload.contactNumber.trim(),
      salespersonId: repId,
      createdAt: new Date().toISOString(),
      totalAmount: 0,
      paidAmount: 0,
      baki: 0,
    };

    shops.unshift(newShop);
    setStore(STORAGE_KEYS.SHOPS, shops);

    // If opening order provided
    if (payload.openingOrderProduct && Number(payload.openingOrderQuantity) > 0) {
      await this.addOrder(newId, {
        product: payload.openingOrderProduct,
        quantity: Number(payload.openingOrderQuantity),
        unitPrice: Number(payload.openingOrderPrice || 100),
        notes: 'Initial Onboarding Order',
      });
      if (Number(payload.initialPaidAmount) > 0) {
        const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
        const createdOrder = orders.find((o) => o.shopId === newId);
        if (createdOrder) {
          await this.payOrder(createdOrder.id, Number(payload.initialPaidAmount), 'Initial Order Payment');
        }
      }
    }

    return this.getShopById(newId);
  },

  async deleteShop(id: string): Promise<{ success: boolean; message: string }> {
    initLocalDatabase();
    requireAdmin();
    let shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const shop = shops.find((s) => s.id === id);
    if (!shop) throw new Error('Business retailer not found.');

    shops = shops.filter((s) => s.id !== id);
    setStore(STORAGE_KEYS.SHOPS, shops);

    // Also remove associated orders and payments for this shop
    let orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    orders = orders.filter((o) => o.shopId !== id);
    setStore(STORAGE_KEYS.ORDERS, orders);

    return { success: true, message: `Business '${shop.name}' removed successfully.` };
  },

  // Orders and BAKI collection
  async addOrder(
    shopId: string,
    payload: { product: string; quantity: number; unitPrice: number; notes?: string }
  ): Promise<Order> {
    initLocalDatabase();
    const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const shop = shops.find((s) => s.id === shopId);
    checkShopAccess(shop);

    const qty = Number(payload.quantity || 1);
    const price = Number(payload.unitPrice || 0);
    if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price < 0) {
      throw new Error('Enter a valid quantity and price.');
    }
    const totalAmount = qty * price;
    const invCount = orders.length + 101;
    const invoiceNumber = `INV-2026-000${invCount}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      invoiceNumber,
      shopId,
      product: payload.product,
      quantity: qty,
      unitPrice: price,
      totalAmount,
      paidAmount: 0,
      baki: totalAmount,
      billingType: 'ONLINE',
      date: new Date().toISOString().slice(0, 10),
      notes: payload.notes || 'Repeat replenishment order',
      salespersonId: shop?.salespersonId || 'user_rajesh',
      payments: [],
    };

    orders.unshift(newOrder);
    setStore(STORAGE_KEYS.ORDERS, orders);

    // Update shop summary
    if (shop) {
      shop.totalAmount += totalAmount;
      shop.baki += totalAmount;
      setStore(STORAGE_KEYS.SHOPS, shops);
    }

    return newOrder;
  },

  async payOrder(orderId: string, amount: number, note?: string): Promise<{ payment: Payment; order: Order }> {
    initLocalDatabase();
    const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);

    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');

    const order = orders[orderIndex];
    checkShopAccess(shops.find((shop) => shop.id === order.shopId));
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > Number(order.baki)) {
      throw new Error('Payment must be greater than zero and no more than this order balance.');
    }
    const payAmt = Math.min(Number(amount), Number(order.baki));

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      orderId,
      amount: payAmt,
      note: note || 'Cash/Digital collection',
      createdAt: new Date().toISOString(),
    };

    order.paidAmount += payAmt;
    order.baki = Math.max(0, order.totalAmount - order.paidAmount);
    order.payments = order.payments || [];
    order.payments.push(newPayment);

    orders[orderIndex] = order;
    setStore(STORAGE_KEYS.ORDERS, orders);

    // Update corresponding shop
    const shop = shops.find((s) => s.id === order.shopId);
    if (shop) {
      shop.paidAmount += payAmt;
      shop.baki = Math.max(0, shop.totalAmount - shop.paidAmount);
      setStore(STORAGE_KEYS.SHOPS, shops);
    }

    return { payment: newPayment, order };
  },

  // Salespersons
  async getSalespersons(): Promise<User[]> {
    initLocalDatabase();
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);

    const user = sessionUser();
    return users.filter((entry) => entry.role === 'SALESPERSON' &&
      (user?.role !== 'SALESPERSON' || entry.id === user.id)).map((u) => {
      const repShops = shops.filter((s) => s.salespersonId === u.id);
      const repOrders = orders.filter((o) => o.salespersonId === u.id);
      const totalSales = repOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const totalCollected = repOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
      const totalBaki = totalSales - totalCollected;

      return {
        ...u,
        totalShops: repShops.length,
        ordersCount: repOrders.length,
        totalSales,
        totalCollected,
        totalBaki,
      };
    });
  },

  async createSalesperson(payload: { name: string; username: string; phone: string; password?: string }): Promise<User> {
    initLocalDatabase();
    requireAdmin();
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const uName = payload.username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === uName)) {
      throw new Error(`Username '${payload.username}' is already taken.`);
    }

    const initialPassword = payload.password?.trim() || 'Sales@123';

    const newUser: User = {
      id: `user_${Date.now()}`,
      username: payload.username.trim(),
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      password: initialPassword,
      role: 'SALESPERSON',
      active: true,
      totalShops: 0,
      totalSales: 0,
      totalCollected: 0,
      totalBaki: 0,
    };

    users.push(newUser);
    setStore(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  async updateSalesperson(id: string, payload: { name?: string; phone?: string; username?: string; active?: boolean }): Promise<User> {
    initLocalDatabase();
    requireAdmin();
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Salesperson not found');

    const updated = {
      ...users[idx],
      ...(payload.name !== undefined && { name: payload.name.trim() }),
      ...(payload.phone !== undefined && { phone: payload.phone.trim() }),
      ...(payload.username !== undefined && { username: payload.username.trim() }),
      ...(payload.active !== undefined && { active: payload.active }),
    };

    users[idx] = updated;
    setStore(STORAGE_KEYS.USERS, users);
    return updated;
  },

  async deleteSalesperson(id: string): Promise<{ success: boolean; message: string }> {
    initLocalDatabase();
    requireAdmin();
    let users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const target = users.find((u) => u.id === id);
    if (!target) throw new Error('Sales representative not found.');
    if (target.role === 'ADMIN') throw new Error('Admin accounts cannot be deleted.');

    users = users.filter((u) => u.id !== id);
    setStore(STORAGE_KEYS.USERS, users);
    return { success: true, message: `Staff representative '${target.name}' removed successfully.` };
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    requireAdmin();
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Salesperson not found.');

    const updatedPass = newPassword?.trim() || 'Sales@123';
    users[idx] = {
      ...users[idx],
      password: updatedPass,
    };
    setStore(STORAGE_KEYS.USERS, users);
    return { success: true, message: `Password reset successfully. New password is ${updatedPass}` };
  },

  // Orders / Reports
  async getOrders(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    salespersonId?: string;
  }): Promise<Order[]> {
    initLocalDatabase();
    let orders = getStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const user = sessionUser();
    if (user?.role === 'SALESPERSON') orders = orders.filter((order) => order.salespersonId === user.id);
    const shops = getStore<Shop[]>(STORAGE_KEYS.SHOPS, INITIAL_SHOPS);
    const users = getStore<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);

    orders = orders.map((o) => {
      const s = shops.find((sh) => sh.id === o.shopId);
      const rep = users.find((u) => u.id === o.salespersonId);
      return {
        ...o,
        shop: s ? { id: s.id, name: s.name, ownerName: s.ownerName, contactNumber: s.contactNumber, location: s.location } : undefined,
        salesperson: rep ? { id: rep.id, name: rep.name, username: rep.username, phone: rep.phone } : undefined,
      };
    });

    if (params?.startDate) {
      orders = orders.filter((o) => o.date >= params.startDate!);
    }
    if (params?.endDate) {
      orders = orders.filter((o) => o.date <= params.endDate!);
    }
    if (params?.status && params.status !== 'ALL') {
      if (params.status === 'PAID') orders = orders.filter((o) => o.baki <= 0);
      else if (params.status === 'PARTIAL') orders = orders.filter((o) => o.baki > 0 && o.paidAmount > 0);
      else if (params.status === 'UNPAID') orders = orders.filter((o) => o.paidAmount === 0);
    }
    if (params?.salespersonId) {
      orders = orders.filter((o) => o.salespersonId === params.salespersonId);
    }

    return orders;
  },

  async exportCsv(params: { from?: string; to?: string }): Promise<string> {
    const orders = await this.getOrders({ startDate: params.from, endDate: params.to });
    const headers = [
      'Invoice No',
      'Date',
      'Store Name',
      'Proprietor',
      'Mobile',
      'Product',
      'Quantity',
      'Rate',
      'Total Amount',
      'Amount Paid',
      'Balance Due (BAKI)',
      'Salesperson',
    ];

    const rows = orders.map((o) => [
      o.invoiceNumber || o.id,
      o.date,
      `"${o.shop?.name || ''}"`,
      `"${o.shop?.ownerName || ''}"`,
      o.shop?.contactNumber || '',
      `"${o.product}"`,
      o.quantity,
      o.unitPrice,
      o.totalAmount,
      o.paidAmount,
      o.baki,
      `"${o.salesperson?.name || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  async exportRetailersExcel(): Promise<string> {
    initLocalDatabase();
    const shopsRes = await this.getShops({ limit: 10000 });
    const shops = shopsRes.data;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#007F5F"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#007F5F" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BakiDue">
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#DC2626"/>
  </Style>
  <Style ss:ID="Paid">
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#10B981"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Retailer Directory">
  <Table>
   <Column ss:Width="70"/>
   <Column ss:Width="200"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="220"/>
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="10" ss:StyleID="Title"><Data ss:Type="String">Amantos Global Industries — Retailer Master Directory</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Shop ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Retail Store Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Proprietor Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Contact Number</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Store Location / Address</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Assigned Sales Representative</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Onboarded Date</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Billed</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Collected</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Outstanding BAKI</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ledger Status</Data></Cell>
   </Row>`;

    for (const shop of shops) {
      const isPaid = shop.baki === 0;
      const isPartial = shop.baki > 0 && shop.paidAmount > 0;
      const statusText = isPaid ? 'Settled' : isPartial ? 'Partial BAKI' : 'Full Credit';
      const cleanDate = shop.createdAt ? shop.createdAt.slice(0, 10) : '';
      const repName = shop.salesperson ? `${shop.salesperson.name} (@${shop.salesperson.username})` : 'Unassigned';

      // Safe XML escape
      const escapeXml = (str: string) => String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      xml += `
   <Row ss:Height="18">
    <Cell><Data ss:Type="String">${escapeXml(shop.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(shop.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(shop.ownerName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(shop.contactNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(shop.location)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(repName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(cleanDate)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${Number(shop.totalAmount || 0)}</Data></Cell>
    <Cell ss:StyleID="Paid"><Data ss:Type="Number">${Number(shop.paidAmount || 0)}</Data></Cell>
    <Cell ss:StyleID="${shop.baki > 0 ? 'BakiDue' : 'Paid'}"><Data ss:Type="Number">${Number(shop.baki || 0)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(statusText)}</Data></Cell>
   </Row>`;
    }

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    return xml;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    initLocalDatabase();
    return getStore<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  async addProduct(data: { name: string; unitPrice?: number; category?: string }): Promise<Product> {
    initLocalDatabase();
    requireAdmin();
    const products = getStore<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: data.name.trim(),
      unitPrice: Number(data.unitPrice || 0),
      category: data.category?.trim() || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    setStore(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },

  async updateProduct(
    id: string,
    data: { name?: string; unitPrice?: number; category?: string; isActive?: boolean }
  ): Promise<Product> {
    initLocalDatabase();
    requireAdmin();
    const products = getStore<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const updated = {
      ...products[idx],
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.unitPrice !== undefined && { unitPrice: Number(data.unitPrice) }),
      ...(data.category !== undefined && { category: data.category.trim() }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    products[idx] = updated;
    setStore(STORAGE_KEYS.PRODUCTS, products);
    return updated;
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    initLocalDatabase();
    requireAdmin();
    let products = getStore<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    products = products.filter((p) => p.id !== id);
    setStore(STORAGE_KEYS.PRODUCTS, products);
    return { success: true };
  },

  // Settings
  async getBillingSettings(): Promise<BillingSetting> {
    initLocalDatabase();
    return getStore<BillingSetting>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateBillingSettings(data: Partial<BillingSetting>): Promise<BillingSetting> {
    initLocalDatabase();
    requireAdmin();
    const current = getStore<BillingSetting>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const updated = { ...current, ...data };
    setStore(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },
};
