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
    const {
      shopName,
      location,
      latitude,
      longitude,
      ownerName,
      contactNumber,
      productName = 'Mixture Pack',
      quantity,
      unitPrice,
      amountPaid = 0,
      visitDate,
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
          createdById: salespersonId,
        },
      });

      // 2. Create the first order
      const order = await tx.order.create({
        data: {
          shopId: shop.id,
          salespersonId,
          productName,
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

      return {
        shop,
        order: {
          ...order,
          payments: initialPayment ? [initialPayment] : [],
        },
      };
    });

    return result;
  }

  /**
   * List shops onboarded by the requesting salesperson (with search & pagination).
   */
  static async getMyShops(
    salespersonId: string,
    params: { page: number; limit: number; search?: string }
  ) {
    const { page, limit, search } = params;
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

    const formatted = shops.map((s) => {
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
        summary: {
          ordersCount,
          totalSales: Math.round(totalSales * 100) / 100,
          totalCollected: Math.round(totalCollected * 100) / 100,
          totalBaki: Math.round(totalBaki * 100) / 100,
        },
      };
    });

    return {
      shops: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
}
