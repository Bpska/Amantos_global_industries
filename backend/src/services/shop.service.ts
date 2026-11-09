import { Prisma, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { calculateOrderAmounts } from '../utils/calculations';
import { parseISTDate } from '../utils/date';
import { OnboardShopInput } from '../validations/shop.validation';

export class ShopService {
  /**
   * Onboard a shop and create its initial order in a single atomic transaction.
   * If amountPaid > 0, the first Payment row is created automatically.
   */
  static async onboardShop(salespersonId: string, input: OnboardShopInput) {
    const shopName = input.shopName || (input as any).name;
    const targetRepId = input.salespersonId || salespersonId;
    const {
      location,
      latitude,
      longitude,
      ownerName,
      contactNumber,
      productName = (input as any).product || 'Mixture Pack 500g',
      billingType = (input as any).billingType || 'ONLINE',
      quantity,
      unitPrice,
      amountPaid = 0,
      visitDate = (input as any).date,
      notes,
    } = input;

    // Server-side calculation and business rule enforcement
    const amounts = calculateOrderAmounts({
      quantity,
      unitPrice,
      amountPaid,
    });

    const parsedDate = parseISTDate(visitDate);

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the shop
      const shop = await tx.shop.create({
        data: {
          shopName,
          location,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          ownerName,
          contactNumber,
          createdById: targetRepId,
        },
      });

      // 2. Create the first order
      const order = await tx.order.create({
        data: {
          shopId: shop.id,
          salespersonId: targetRepId,
          productName,
          billingType: billingType === 'PHYSICAL' ? 'PHYSICAL' : 'ONLINE',
          quantity,
          unitPrice: amounts.totalAmount / quantity, // exact unitPrice
          totalAmount: amounts.totalAmount,
          amountPaid: amounts.amountPaid,
          balanceDue: amounts.balanceDue,
          visitDate: parsedDate.date,
          visitDay: parsedDate.dayName,
          notes: notes || null,
        },
      });

      // 3. Initial amountPaid creates the first Payment row if amountPaid > 0
      let initialPayment = null;
      if (amounts.amountPaid > 0) {
        initialPayment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: amounts.amountPaid,
            paidOn: new Date(),
            note: 'Initial payment at shop onboarding',
            recordedById: salespersonId,
          },
        });
      }

      const shopTotal = amounts.totalAmount;
      const shopPaid = amounts.amountPaid;
      const shopBaki = amounts.balanceDue;
      const shopStatus = shopBaki === 0 ? 'PAID' : (shopPaid > 0 ? 'PARTIAL' : 'UNPAID');

      const formattedOrder = {
        id: order.id,
        invoiceNumber: `INV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`,
        billingType: order.billingType || 'ONLINE',
        product: order.productName,
        productName: order.productName,
        quantity: order.quantity,
        unitPrice: Number(order.unitPrice),
        totalAmount: shopTotal,
        amountPaid: shopPaid,
        paidAmount: shopPaid,
        balanceDue: shopBaki,
        baki: shopBaki,
        status: shopStatus,
        date: order.visitDate.toISOString(),
        visitDate: order.visitDate.toISOString(),
        visitDay: order.visitDay,
        notes: order.notes,
        payments: initialPayment
          ? [
              {
                id: initialPayment.id,
                amount: Number(initialPayment.amount),
                createdAt: initialPayment.paidOn.toISOString(),
                note: initialPayment.note,
              },
            ]
          : [],
      };

      const formattedShop = {
        id: shop.id,
        name: shop.shopName,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        contactNumber: shop.contactNumber,
        location: shop.location,
        createdAt: shop.createdAt.toISOString(),
        totalAmount: shopTotal,
        paidAmount: shopPaid,
        baki: shopBaki,
        status: shopStatus,
        orders: [formattedOrder],
      };

      return {
        shop: formattedShop,
        order: formattedOrder,
        ...formattedShop,
      };
    });

    return result;
  }

  /**
   * List shops onboarded by the requesting salesperson (with search & pagination).
   */
  static async getMyShops(
    salespersonId: string,
    params: { page: number; limit: number; search?: string; status?: string }
  ) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ShopWhereInput = {
      createdById: salespersonId,
    };

    if (search) {
      where.OR = [
        { shopName: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, shops] = await Promise.all([
      prisma.shop.count({ where }),
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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

    let formatted = shops.map((s) => {
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

    if (status && status !== 'ALL') {
      formatted = formatted.filter((s) => s.status === status);
    }

    return {
      shops: formatted,
      data: formatted,
      items: formatted,
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

  /**
   * Get single shop details with orders and payments.
   * Salespersons can see ONLY their own shops. Admin can see everything.
   */
  static async getShopById(shopId: string, requestingUser: { id: string; role: Role }) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
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
          orderBy: { createdAt: 'desc' },
          include: {
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

    if (requestingUser.role !== Role.ADMIN && shop.createdById !== requestingUser.id) {
      throw new ForbiddenError('You do not have permission to view this shop');
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
}
