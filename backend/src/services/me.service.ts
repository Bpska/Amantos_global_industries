import { prisma } from '../utils/prisma';
import { getTodayISTRange } from '../utils/date';

export class MeService {
  static async getSalespersonSummary(salespersonId: string) {
    // 1. All-time numbers for this salesperson
    const [shopsCount, ordersCount, aggregateSums] = await Promise.all([
      prisma.shop.count({
        where: { createdById: salespersonId },
      }),
      prisma.order.count({
        where: { salespersonId },
      }),
      prisma.order.aggregate({
        where: { salespersonId },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
    ]);

    const totalSales = Number(aggregateSums._sum.totalAmount || 0);
    const totalCollected = Number(aggregateSums._sum.amountPaid || 0);
    const totalBaki = Number(aggregateSums._sum.balanceDue || 0);

    const roundedSales = Math.round(totalSales * 100) / 100;
    const roundedCollected = Math.round(totalCollected * 100) / 100;
    const roundedBaki = Math.round(totalBaki * 100) / 100;

    // 2. Today's numbers in IST
    const { start: todayStart, end: todayEnd } = getTodayISTRange();
    const todayWhere = {
      salespersonId,
      visitDate: {
        gte: new Date(todayStart.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        lte: new Date(todayEnd.toISOString().split('T')[0] + 'T23:59:59.999Z'),
      },
    };

    const [todayOrdersCount, todaySums, todayShopsCount] = await Promise.all([
      prisma.order.count({ where: todayWhere }),
      prisma.order.aggregate({
        where: todayWhere,
        _sum: {
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
        },
      }),
      prisma.shop.count({
        where: {
          createdById: salespersonId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    const todayNumbers = {
      shopsOnboardedToday: todayShopsCount,
      ordersCount: todayOrdersCount,
      sales: Math.round(Number(todaySums._sum.totalAmount || 0) * 100) / 100,
      collected: Math.round(Number(todaySums._sum.amountPaid || 0) * 100) / 100,
      baki: Math.round(Number(todaySums._sum.balanceDue || 0) * 100) / 100,
    };

    // 3. Recent 5 shops with total amounts
    const recentShops = await prisma.shop.findMany({
      where: { createdById: salespersonId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: {
            totalAmount: true,
            amountPaid: true,
            balanceDue: true,
            createdAt: true,
          },
        },
      },
    });

    const recentEntries = (recentShops || []).map((s) => {
      const orders = s.orders || [];
      const sTotal = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const sPaid = orders.reduce((sum, o) => sum + Number(o.amountPaid || 0), 0);
      const sBaki = orders.reduce((sum, o) => sum + Number(o.balanceDue || 0), 0);

      const rTotal = Math.round(sTotal * 100) / 100;
      const rPaid = Math.round(sPaid * 100) / 100;
      const rBaki = Math.round(sBaki * 100) / 100;

      return {
        id: s.id,
        name: s.shopName,
        shopName: s.shopName,
        ownerName: s.ownerName,
        contactNumber: s.contactNumber,
        location: s.location,
        createdAt: s.createdAt.toISOString(),
        totalAmount: rTotal,
        paidAmount: rPaid,
        baki: rBaki,
        status: rBaki === 0 ? 'PAID' : (rPaid > 0 ? 'PARTIAL' : 'UNPAID'),
      };
    });

    return {
      // Flat properties for frontend
      totalShops: shopsCount,
      totalOrders: ordersCount,
      totalSales: roundedSales,
      totalCollected: roundedCollected,
      totalBaki: roundedBaki,
      todayVisits: todayNumbers.ordersCount,
      todaySales: todayNumbers.sales,
      todayCollected: todayNumbers.collected,
      todayBaki: todayNumbers.baki,
      recentEntries,

      // Structured nested properties
      shopsCount,
      ordersCount,
      today: todayNumbers,
    };
  }
}
