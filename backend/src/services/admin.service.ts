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
  from?: string;
  to?: string;
  status?: string;
}

export interface AdminOrdersFilter {
  page: number;
  limit: number;
  salespersonId?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  status?: 'PAID' | 'PARTIAL' | 'UNPAID' | string;
}

export class AdminService {
  static async createSalesperson(data: {
    username: string;
    password: string;
    fullName?: string;
    name?: string;
    phone?: string | null;
  }) {
    const username = data.username.trim().toLowerCase();
    const fullName = (data.fullName || data.name || username).trim();
    const existing = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new BadRequestError(`Username '${data.username}' is already taken`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password.trim(), salt);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        phone: data.phone?.trim() || null,
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

    return {
      ...user,
      name: user.fullName,
      active: user.isActive,
    };
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
            shopId: true,
            visitDate: true,
            totalAmount: true,
            amountPaid: true,
            balanceDue: true,
          },
        },
      },
    });

    const todayStr = new Date().toISOString().slice(0, 10);

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

      const roundedSales = Math.round(salesAmount * 100) / 100;
      const roundedCollected = Math.round(collected * 100) / 100;
      const roundedBaki = Math.round(baki * 100) / 100;

      // Calculate store visit metrics
      const uniqueStoresVisited = new Set(sp.orders.map((o) => o.shopId)).size;
      const totalVisits = sp.orders.length;
      const todayVisits = sp.orders.filter(
        (o) => o.visitDate && o.visitDate.toISOString().slice(0, 10) === todayStr
      ).length;

      return {
        id: sp.id,
        username: sp.username,
        fullName: sp.fullName,
        name: sp.fullName,
        phone: sp.phone,
        role: sp.role,
        isActive: sp.isActive,
        active: sp.isActive,
        createdAt: sp.createdAt,
        totalShops: sp._count.createdShops,
        totalOrders: sp._count.orders,
        storesVisited: uniqueStoresVisited,
        uniqueStoresVisited,
        totalVisits,
        todayVisits,
        totalSales: roundedSales,
        totalCollected: roundedCollected,
        totalBaki: roundedBaki,
        totals: {
          shopsOnboarded: sp._count.createdShops,
          ordersCount: sp._count.orders,
          storesVisited: uniqueStoresVisited,
          totalVisits,
          todayVisits,
          salesAmount: roundedSales,
          collected: roundedCollected,
          baki: roundedBaki,
        },
      };
    });
  }

  static async updateSalesperson(
    id: string,
    data: { fullName?: string; name?: string; phone?: string | null; isActive?: boolean; active?: boolean }
  ) {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.role !== Role.SALESPERSON) {
      throw new NotFoundError('Salesperson not found');
    }

    const fullName = data.fullName !== undefined ? data.fullName : data.name;
    const isActive = data.isActive !== undefined ? data.isActive : data.active;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(isActive !== undefined && { isActive }),
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

    return {
      ...updated,
      name: updated.fullName,
      active: updated.isActive,
    };
  }

  static async deleteSalesperson(id: string) {
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.role !== Role.SALESPERSON) {
      throw new NotFoundError('Sales representative not found');
    }

    // Find the admin user to reassign historical records or cascade clean
    const adminUser = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    const fallbackAdminId = adminUser ? adminUser.id : id;

    await prisma.$transaction(async (tx) => {
      if (adminUser && adminUser.id !== id) {
        // Reassign shops created by this salesperson to Admin so shops are not lost
        await tx.shop.updateMany({
          where: { createdById: id },
          data: { createdById: fallbackAdminId },
        });

        // Reassign orders by this salesperson to Admin
        await tx.order.updateMany({
          where: { salespersonId: id },
          data: { salespersonId: fallbackAdminId },
        });

        // Reassign payments recorded by this salesperson to Admin
        await tx.payment.updateMany({
          where: { recordedById: id },
          data: { recordedById: fallbackAdminId },
        });
      } else {
        // If no alternative admin, delete associated payments, orders, shops
        await tx.payment.deleteMany({
          where: { recordedById: id },
        });
        await tx.order.deleteMany({
          where: { salespersonId: id },
        });
        await tx.shop.deleteMany({
          where: { createdById: id },
        });
      }

      // Finally delete the salesperson account
      await tx.user.delete({
        where: { id },
      });
    });

    return { message: `Sales representative '${existing.fullName}' deleted successfully` };
  }

  static async deleteShop(id: string) {
    const existing = await prisma.shop.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Retailer not found');
    }

    await prisma.shop.delete({
      where: { id },
    });

    return { message: `Retail merchant '${existing.shopName}' and associated records deleted successfully` };
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
    const { page, limit, search, salespersonId } = filter;
    const startDate = filter.startDate || (filter.from ? filter.from.split('T')[0] : undefined);
    const endDate = filter.endDate || (filter.to ? filter.to.split('T')[0] : undefined);
    const status = filter.status && filter.status !== 'ALL' ? filter.status : undefined;

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

    let formattedShops = shops.map((s) => {
      const ordersCount = s.orders.length;
      const totalSales = s.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const totalCollected = s.orders.reduce((sum, o) => sum + Number(o.amountPaid), 0);
      const totalBaki = s.orders.reduce((sum, o) => sum + Number(o.balanceDue), 0);

      const roundedSales = Math.round(totalSales * 100) / 100;
      const roundedCollected = Math.round(totalCollected * 100) / 100;
      const roundedBaki = Math.round(totalBaki * 100) / 100;

      const shopStatus = roundedBaki === 0 ? 'PAID' : (roundedCollected > 0 ? 'PARTIAL' : 'UNPAID');

      return {
        id: s.id,
        name: s.shopName,
        shopName: s.shopName,
        location: s.location,
        latitude: s.latitude,
        longitude: s.longitude,
        ownerName: s.ownerName,
        contactNumber: s.contactNumber,
        createdAt: s.createdAt.toISOString(),
        createdBy: s.createdBy,
        salesperson: s.createdBy
          ? {
              id: s.createdBy.id,
              username: s.createdBy.username,
              fullName: s.createdBy.fullName,
              name: s.createdBy.fullName,
              phone: s.createdBy.phone,
              role: Role.SALESPERSON,
            }
          : undefined,
        totalAmount: roundedSales,
        paidAmount: roundedCollected,
        baki: roundedBaki,
        status: shopStatus,
        summary: {
          ordersCount,
          totalSales: roundedSales,
          totalCollected: roundedCollected,
          totalBaki: roundedBaki,
        },
      };
    });

    if (status) {
      formattedShops = formattedShops.filter((s) => s.status === status);
    }

    return {
      shops: formattedShops,
      data: formattedShops,
      items: formattedShops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      page,
      totalPages: Math.ceil(total / limit),
      total,
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

    const roundedSales = Math.round(totalSales * 100) / 100;
    const roundedCollected = Math.round(totalCollected * 100) / 100;
    const roundedBaki = Math.round(totalBaki * 100) / 100;
    const shopStatus = roundedBaki === 0 ? 'PAID' : (roundedCollected > 0 ? 'PARTIAL' : 'UNPAID');

    const formattedOrders = shop.orders.map((o) => {
      const ordPaid = Number(o.amountPaid);
      const ordBaki = Number(o.balanceDue);
      const ordTotal = Number(o.totalAmount);
      const ordStatus = ordBaki === 0 ? 'PAID' : (ordPaid > 0 ? 'PARTIAL' : 'UNPAID');

      return {
        id: o.id,
        invoiceNumber: `INV-${new Date(o.createdAt).getFullYear()}-${o.id.slice(0, 6).toUpperCase()}`,
        billingType: o.billingType || 'ONLINE',
        product: o.productName,
        productName: o.productName,
        quantity: o.quantity,
        unitPrice: Number(o.unitPrice),
        totalAmount: ordTotal,
        amountPaid: ordPaid,
        paidAmount: ordPaid,
        balanceDue: ordBaki,
        baki: ordBaki,
        status: ordStatus,
        date: o.visitDate.toISOString(),
        visitDate: o.visitDate.toISOString(),
        visitDay: o.visitDay,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        salesperson: o.salesperson
          ? {
              ...o.salesperson,
              name: o.salesperson.fullName,
            }
          : undefined,
        payments: o.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          note: p.note,
          createdAt: p.paidOn.toISOString(),
          paidOn: p.paidOn.toISOString(),
        })),
      };
    });

    return {
      ...shop,
      id: shop.id,
      name: shop.shopName,
      shopName: shop.shopName,
      location: shop.location,
      ownerName: shop.ownerName,
      contactNumber: shop.contactNumber,
      createdAt: shop.createdAt.toISOString(),
      salesperson: shop.createdBy
        ? {
            ...shop.createdBy,
            name: shop.createdBy.fullName,
          }
        : undefined,
      totalAmount: roundedSales,
      paidAmount: roundedCollected,
      baki: roundedBaki,
      status: shopStatus,
      orders: formattedOrders,
      summary: {
        ordersCount: shop.orders.length,
        totalSales: roundedSales,
        totalCollected: roundedCollected,
        totalBaki: roundedBaki,
      },
    };
  }

  static async getOrders(filter: AdminOrdersFilter) {
    const { page, limit, salespersonId, status } = filter;
    const startDate = filter.startDate || (filter.from ? filter.from.split('T')[0] : undefined);
    const endDate = filter.endDate || (filter.to ? filter.to.split('T')[0] : undefined);
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

    if ((filter as any).billingType && (filter as any).billingType !== 'ALL') {
      where.billingType = (filter as any).billingType;
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

    const formattedOrders = orders.map((o) => {
      const ordPaid = Number(o.amountPaid);
      const ordBaki = Number(o.balanceDue);
      const ordTotal = Number(o.totalAmount);
      const ordStatus = ordBaki === 0 ? 'PAID' : (ordPaid > 0 ? 'PARTIAL' : 'UNPAID');

      return {
        id: o.id,
        invoiceNumber: `INV-${new Date(o.createdAt).getFullYear()}-${o.id.slice(0, 6).toUpperCase()}`,
        billingType: o.billingType || 'ONLINE',
        product: o.productName,
        productName: o.productName,
        quantity: o.quantity,
        unitPrice: Number(o.unitPrice),
        totalAmount: ordTotal,
        amountPaid: ordPaid,
        paidAmount: ordPaid,
        balanceDue: ordBaki,
        baki: ordBaki,
        status: ordStatus,
        date: o.visitDate.toISOString(),
        visitDate: o.visitDate.toISOString(),
        visitDay: o.visitDay,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        shop: {
          id: o.shop.id,
          name: o.shop.shopName,
          shopName: o.shop.shopName,
          ownerName: o.shop.ownerName,
          contactNumber: o.shop.contactNumber,
          location: o.shop.location,
        },
        salesperson: {
          id: o.salesperson.id,
          username: o.salesperson.username,
          fullName: o.salesperson.fullName,
          name: o.salesperson.fullName,
        },
        payments: o.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          createdAt: p.paidOn.toISOString(),
          paidOn: p.paidOn.toISOString(),
          note: p.note,
        })),
      };
    });

    return {
      orders: formattedOrders,
      data: formattedOrders,
      items: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  }

  static async getDashboard(filter?: { startDate?: string; endDate?: string; from?: string; to?: string }) {
    const startDate = filter?.startDate || (filter?.from ? filter.from.split('T')[0] : undefined);
    const endDate = filter?.endDate || (filter?.to ? filter.to.split('T')[0] : undefined);

    const orderWhere: Prisma.OrderWhereInput = {};
    const shopWhere: Prisma.ShopWhereInput = {};
    const hasDateFilter = Boolean(startDate || endDate);

    if (hasDateFilter) {
      orderWhere.visitDate = {};
      shopWhere.createdAt = {};
      if (startDate) {
        orderWhere.visitDate.gte = new Date(`${startDate}T00:00:00.000Z`);
        shopWhere.createdAt.gte = new Date(`${startDate}T00:00:00+05:30`);
      }
      if (endDate) {
        orderWhere.visitDate.lte = new Date(`${endDate}T23:59:59.999Z`);
        shopWhere.createdAt.lte = new Date(`${endDate}T23:59:59+05:30`);
      }
    }

    // 1. Overall aggregations
    const [totalShops, totalOrders, orderSums] = await Promise.all([
      prisma.shop.count(hasDateFilter ? { where: shopWhere } : undefined),
      prisma.order.count(hasDateFilter ? { where: orderWhere } : undefined),
      prisma.order.aggregate({
        where: hasDateFilter ? orderWhere : undefined,
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

    const roundedSales = Math.round(totalSales * 100) / 100;
    const roundedCollected = Math.round(totalCollected * 100) / 100;
    const roundedBaki = Math.round(totalBaki * 100) / 100;

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

        const daySales = Math.round(Number(sums._sum.totalAmount || 0) * 100) / 100;

        return {
          date: day.dateStr,
          day: day.dayName,
          orders: sums._count.id,
          sales: daySales,
          amount: daySales,
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
          where: hasDateFilter ? orderWhere : undefined,
          select: {
            shopId: true,
            visitDate: true,
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
        const uniqueStores = new Set(sp.orders.map((o) => o.shopId)).size;
        const todayStrNow = new Date().toISOString().slice(0, 10);
        const todayVisitsCount = sp.orders.filter(
          (o) => o.visitDate && o.visitDate.toISOString().slice(0, 10) === todayStrNow
        ).length;

        return {
          id: sp.id,
          username: sp.username,
          fullName: sp.fullName,
          name: sp.fullName,
          shopsCount: sp._count.createdShops,
          totalShops: sp._count.createdShops,
          storesVisited: uniqueStores,
          totalVisits: sp.orders.length,
          todayVisits: todayVisitsCount,
          ordersCount: sp.orders.length,
          totalSales: Math.round(sales * 100) / 100,
          collected: Math.round(collected * 100) / 100,
          totalCollected: Math.round(collected * 100) / 100,
          baki: Math.round(baki * 100) / 100,
          totalBaki: Math.round(baki * 100) / 100,
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
        const roundedBaki = Math.round(totalBaki * 100) / 100;
        return {
          id: s.id,
          name: s.shopName,
          shopName: s.shopName,
          ownerName: s.ownerName,
          contactNumber: s.contactNumber,
          location: s.location,
          totalSales: Math.round(totalSales * 100) / 100,
          totalBaki: roundedBaki,
          baki: roundedBaki,
        };
      })
      .filter((s) => s.totalBaki > 0)
      .sort((a, b) => b.totalBaki - a.totalBaki)
      .slice(0, 5);

    const collectionRate = roundedSales > 0 ? Math.min(100, Math.round((roundedCollected / roundedSales) * 100)) : 100;

    return {
      // Flat fields for mobile frontend
      totalShops,
      totalOrders,
      totalSales: roundedSales,
      totalCollected: roundedCollected,
      totalBaki: roundedBaki,
      collectionRate,
      salespersonsLeaderboard: topSalespersons,
      recentShops: [],
      todayVisits: todayNumbers.ordersCount,
      todaySales: todayNumbers.totalSales,
      todayCollected: todayNumbers.collected,
      todayBaki: todayNumbers.baki,
      sevenDaySales: chartData.map((c) => ({ date: c.date, amount: c.sales })),

      // Structured fields
      summary: {
        totalShops,
        totalOrders,
        totalSales: roundedSales,
        totalCollected: roundedCollected,
        totalBaki: roundedBaki,
      },
      today: todayNumbers,
      last7DaysChart: chartData,
      topSalespersons,
      topBakiShops,
    };
  }

  static async exportOrdersCsv(filter: Omit<AdminOrdersFilter, 'page' | 'limit'>) {
    const startDate = filter.startDate || (filter.from ? filter.from.split('T')[0] : undefined);
    const endDate = filter.endDate || (filter.to ? filter.to.split('T')[0] : undefined);

    const where: Prisma.OrderWhereInput = {};

    if (filter.salespersonId) {
      where.salespersonId = filter.salespersonId;
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

  static async getBillingSettings() {
    let settings = await prisma.billingSetting.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await prisma.billingSetting.create({
        data: {
          id: 'default',
          businessName: 'AGI',
          tagline: 'Wholesale & Retail Replenishment Network',
          phone: '+91 98765 43210',
          address: 'Main Commercial Hub',
          terms: 'Goods once sold are subject to standard quality warranty. Please clear pending BAKI within 30 days of invoice date.',
          logoUrl: '/assets/agi-logo.jpg',
        },
      });
    }
    return settings;
  }

  static async updateBillingSettings(data: {
    businessName?: string;
    tagline?: string;
    phone?: string;
    address?: string;
    terms?: string;
    logoUrl?: string;
  }) {
    const settings = await prisma.billingSetting.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        businessName: data.businessName || 'AGI',
        tagline: data.tagline,
        phone: data.phone,
        address: data.address,
        terms: data.terms,
        logoUrl: data.logoUrl || '/assets/agi-logo.jpg',
      },
      update: {
        ...(data.businessName !== undefined ? { businessName: data.businessName } : {}),
        ...(data.tagline !== undefined ? { tagline: data.tagline } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.terms !== undefined ? { terms: data.terms } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
      },
    });
    return settings;
  }
}
