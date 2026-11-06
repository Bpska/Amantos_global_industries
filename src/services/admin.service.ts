import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { getLastNDaysIST, getTodayISTRange } from '../utils/date';

export interface AdminShopsFilter {
  page: number;
  limit: number;
  search?: string;
  salespersonId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdminOrdersFilter {
  page: number;
  limit: number;
  salespersonId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export class AdminService {
  static async createSalesperson(data: {
    username: string;
    password: string;
    fullName: string;
    phone?: string | null;
  }) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      throw new BadRequestError(`Username '${data.username}' is already taken`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone || null,
        role: Role.SALESPERSON,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async listSalespersons() {
    const salespersons = await prisma.user.findMany({
      where: { role: Role.SALESPERSON },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            createdShops: true,
            orders: true,
          },
        },
        orders: {
          select: {
            totalAmount: true,
            amountPaid: true,
            balanceDue: true,
          },
        },
      },
    });

    // Aggregate totals for each salesperson
    return salespersons.map((sp) => {
      const salesAmount = sp.orders.reduce(
        (sum, ord) => sum + Number(ord.totalAmount),
        0
      );
      const collected = sp.orders.reduce(
        (sum, ord) => sum + Number(ord.amountPaid),
        0
      );
      const baki = sp.orders.reduce(
        (sum, ord) => sum + Number(ord.balanceDue),
        0
      );

      return {
        id: sp.id,
        username: sp.username,
        fullName: sp.fullName,
        phone: sp.phone,
        role: sp.role,
        isActive: sp.isActive,
        createdAt: sp.createdAt,
        totals: {
          shopsOnboarded: sp._count.createdShops,
          ordersCount: sp._count.orders,
          salesAmount: Math.round(salesAmount * 100) / 100,
          collected: Math.round(collected * 100) / 100,
          baki: Math.round(baki * 100) / 100,
        },
      };
    });
  }

  static async updateSalesperson(
    id: string,
    data: { fullName?: string; phone?: string | null; isActive?: boolean }
  ) {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.role !== Role.SALESPERSON) {
      throw new NotFoundError('Salesperson not found');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  static async resetSalespersonPassword(id: string, newPassword: string) {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.role !== Role.SALESPERSON) {
      throw new NotFoundError('Salesperson not found');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Salesperson password reset successfully' };
  }

  static async getShops(filter: AdminShopsFilter) {
    const { page, limit, search, salespersonId, startDate, endDate } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ShopWhereInput = {};

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (salespersonId) {
      where.createdById = salespersonId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00+05:30`);
      }
      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999+05:30`);
      }
    }

    const [total, shops] = await Promise.all([
      prisma.shop.count({ where }),
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
              phone: true,
            },
          },
          orders: {
            select: {
              id: true,
              totalAmount: true,
              amountPaid: true,
              balanceDue: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const formattedShops = shops.map((s) => {
      const ordersCount = s.orders.length;
      const totalSales = s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const totalCollected = s.orders.reduce((sum, o) => sum + Number(o.amountPaid), 0);
      const totalBaki = s.orders.reduce((sum, o) => sum + Number(o.balanceDue), 0);

      return {
        id: s.id,
        shopName: s.shopName,
        location: s.location,
        latitude: s.latitude,
        longitude: s.longitude,
        ownerName: s.ownerName,
        contactNumber: s.contactNumber,
        createdAt: s.createdAt,
        createdBy: s.createdBy,
        summary: {
          ordersCount,
          totalSales: Math.round(totalSales * 100) / 100,
          totalCollected: Math.round(totalCollected * 100) / 100,
          totalBaki: Math.round(totalBaki * 100) / 100,
        },
      };
    });

    return {
      shops: formattedShops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getShopById(id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            salesperson: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
            payments: {
              orderBy: { paidOn: 'desc' },
              include: {
                recordedBy: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    const totalSales = shop.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalCollected = shop.orders.reduce((sum, o) => sum + Number(o.amountPaid), 0);
    const totalBaki = shop.orders.reduce((sum, o) => sum + Number(o.balanceDue), 0);

    return {
      ...shop,
      summary: {
        ordersCount: shop.orders.length,
        totalSales: Math.round(totalSales * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalBaki: Math.round(totalBaki * 100) / 100,
      },
    };
  }

  static async getOrders(filter: AdminOrdersFilter) {
    const { page, limit, salespersonId, startDate, endDate, status } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (salespersonId) {
      where.salespersonId = salespersonId;
    }

    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) {
        where.visitDate.gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        where.visitDate.lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    if (status === 'PAID') {
      where.balanceDue = 0;
    } else if (status === 'PARTIAL') {
      where.balanceDue = { gt: 0 };
      where.amountPaid = { gt: 0 };
    } else if (status === 'UNPAID') {
      where.amountPaid = 0;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: {
            select: {
              id: true,
              shopName: true,
              ownerName: true,
              contactNumber: true,
              location: true,
            },
          },
          salesperson: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          payments: {
            orderBy: { paidOn: 'desc' },
          },
        },
      }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getDashboard() {
    // 1. Overall aggregations
    const [totalShops, totalOrders, orderSums] = await Promise.all([
      prisma.shop.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
    ]);

    const totalSales = Number(orderSums._sum.totalAmount || 0);
    const totalCollected = Number(orderSums._sum.amountPaid || 0);
    const totalBaki = Number(orderSums._sum.balanceDue || 0);

    // 2. Today's numbers in IST
    const { start: todayStart, end: todayEnd } = getTodayISTRange();
    const [todayOrdersCount, todayOrderSums] = await Promise.all([
      prisma.order.count({
        where: {
          visitDate: {
            gte: new Date(todayStart.toISOString().split('T')[0] + 'T00:00:00.000Z'),
            lte: new Date(todayEnd.toISOString().split('T')[0] + 'T23:59:59.999Z'),
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          visitDate: {
            gte: new Date(todayStart.toISOString().split('T')[0] + 'T00:00:00.000Z'),
            lte: new Date(todayEnd.toISOString().split('T')[0] + 'T23:59:59.999Z'),
          },
        },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
    ]);

    const todayNumbers = {
      ordersCount: todayOrdersCount,
      totalSales: Math.round(Number(todayOrderSums._sum.totalAmount || 0) * 100) / 100,
      collected: Math.round(Number(todayOrderSums._sum.amountPaid || 0) * 100) / 100,
      baki: Math.round(Number(todayOrderSums._sum.balanceDue || 0) * 100) / 100,
    };

    // 3. Last 7 days chart data
    const last7Days = getLastNDaysIST(7);
    const chartData = await Promise.all(
      last7Days.map(async (day) => {
        const sums = await prisma.order.aggregate({
          where: {
            visitDate: day.dbDate,
          },
          _count: {
            id: true,
          },
          _sum: {
            totalAmount: true,
            amountPaid: true,
            balanceDue: true,
          },
        });

        return {
          date: day.dateStr,
          day: day.dayName,
          orders: sums._count.id,
          sales: Math.round(Number(sums._sum.totalAmount || 0) * 100) / 100,
          collected: Math.round(Number(sums._sum.amountPaid || 0) * 100) / 100,
          baki: Math.round(Number(sums._sum.balanceDue || 0) * 100) / 100,
        };
      })
    );

    // 4. Top 5 Salespersons by total sales
    const salespersons = await prisma.user.findMany({
      where: { role: Role.SALESPERSON },
      select: {
        id: true,
        username: true,
        fullName: true,
        orders: {
          select: {
            totalAmount: true,
            amountPaid: true,
            balanceDue: true,
          },
        },
        _count: {
          select: {
            createdShops: true,
          },
        },
      },
    });

    const topSalespersons = salespersons
      .map((sp) => {
        const sales = sp.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const collected = sp.orders.reduce((sum, o) => sum + Number(o.amountPaid), 0);
        const baki = sp.orders.reduce((sum, o) => sum + Number(o.balanceDue), 0);
        return {
          id: sp.id,
          username: sp.username,
          fullName: sp.fullName,
          shopsCount: sp._count.createdShops,
          ordersCount: sp.orders.length,
          totalSales: Math.round(sales * 100) / 100,
          collected: Math.round(collected * 100) / 100,
          baki: Math.round(baki * 100) / 100,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    // 5. Top 5 Baki Shops (by balanceDue sum descending)
    const shopsWithOrders = await prisma.shop.findMany({
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        contactNumber: true,
        location: true,
        orders: {
          select: {
            balanceDue: true,
            totalAmount: true,
          },
        },
      },
    });

    const topBakiShops = shopsWithOrders
      .map((s) => {
        const totalBaki = s.orders.reduce((sum, o) => sum + Number(o.balanceDue), 0);
        const totalSales = s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        return {
          id: s.id,
          shopName: s.shopName,
          ownerName: s.ownerName,
          contactNumber: s.contactNumber,
          location: s.location,
          totalSales: Math.round(totalSales * 100) / 100,
          totalBaki: Math.round(totalBaki * 100) / 100,
        };
      })
      .filter((s) => s.totalBaki > 0)
      .sort((a, b) => b.totalBaki - a.totalBaki)
      .slice(0, 5);

    return {
      summary: {
        totalShops,
        totalOrders,
        totalSales: Math.round(totalSales * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalBaki: Math.round(totalBaki * 100) / 100,
      },
      today: todayNumbers,
      last7DaysChart: chartData,
      topSalespersons,
      topBakiShops,
    };
  }

  static async exportOrdersCsv(filter: Omit<AdminOrdersFilter, 'page' | 'limit'>) {
    const where: Prisma.OrderWhereInput = {};

    if (filter.salespersonId) {
      where.salespersonId = filter.salespersonId;
    }

    if (filter.startDate || filter.endDate) {
      where.visitDate = {};
      if (filter.startDate) {
        where.visitDate.gte = new Date(`${filter.startDate}T00:00:00.000Z`);
      }
      if (filter.endDate) {
        where.visitDate.lte = new Date(`${filter.endDate}T23:59:59.999Z`);
      }
    }

    if (filter.status === 'PAID') {
      where.balanceDue = 0;
    } else if (filter.status === 'PARTIAL') {
      where.balanceDue = { gt: 0 };
      where.amountPaid = { gt: 0 };
    } else if (filter.status === 'UNPAID') {
      where.amountPaid = 0;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: {
            shopName: true,
            ownerName: true,
            contactNumber: true,
            location: true,
          },
        },
        salesperson: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Generate CSV content
    const headers = [
      'Order ID',
      'Visit Date',
      'Visit Day',
      'Shop Name',
      'Owner Name',
      'Contact Number',
      'Location',
      'Salesperson Username',
      'Salesperson Name',
      'Product Name',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Amount Paid',
      'Balance Due',
      'Status',
      'Notes',
      'Created At',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = orders.map((o) => {
      let status = 'UNPAID';
      const baki = Number(o.balanceDue);
      const paid = Number(o.amountPaid);
      if (baki === 0) status = 'PAID';
      else if (paid > 0) status = 'PARTIAL';

      return [
        escapeCsv(o.id),
        escapeCsv(o.visitDate.toISOString().split('T')[0]),
        escapeCsv(o.visitDay),
        escapeCsv(o.shop.shopName),
        escapeCsv(o.shop.ownerName),
        escapeCsv(o.shop.contactNumber),
        escapeCsv(o.shop.location),
        escapeCsv(o.salesperson.username),
        escapeCsv(o.salesperson.fullName),
        escapeCsv(o.productName),
        escapeCsv(o.quantity),
        escapeCsv(Number(o.unitPrice).toFixed(2)),
        escapeCsv(Number(o.totalAmount).toFixed(2)),
        escapeCsv(Number(o.amountPaid).toFixed(2)),
        escapeCsv(Number(o.balanceDue).toFixed(2)),
        escapeCsv(status),
        escapeCsv(o.notes || ''),
        escapeCsv(o.createdAt.toISOString()),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
