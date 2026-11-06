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

    return {
      shopsCount,
      ordersCount,
      totalSales: Math.round(totalSales * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalBaki: Math.round(totalBaki * 100) / 100,
      today: todayNumbers,
    };
  }
}
