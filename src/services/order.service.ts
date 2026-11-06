import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { calculateOrderAmounts, calculatePaymentUpdate } from '../utils/calculations';
import { parseISTDate } from '../utils/date';
import { CreateRepeatOrderInput, CreatePaymentInput } from '../validations/order.validation';

export class OrderService {
  /**
   * Create a repeat order for an existing shop.
   * Salespersons can create orders only for their own shops (Admin can create for any).
   * If initial amountPaid > 0, creates the first Payment record.
   */
  static async createRepeatOrder(
    shopId: string,
    requestingUser: { id: string; role: Role },
    input: CreateRepeatOrderInput
  ) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    if (requestingUser.role !== Role.ADMIN && shop.createdById !== requestingUser.id) {
      throw new ForbiddenError('You can only create orders for shops you onboarded');
    }

    const {
      productName = 'Mixture Pack',
      quantity,
      unitPrice,
      amountPaid = 0,
      visitDate,
      notes,
    } = input;

    // Server-side calculation & validation
    const amounts = calculateOrderAmounts({
      quantity,
      unitPrice,
      amountPaid,
    });

    const parsedDate = parseISTDate(visitDate);

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          shopId,
          salespersonId: requestingUser.id,
          productName,
          quantity,
          unitPrice: amounts.totalAmount / quantity,
          totalAmount: amounts.totalAmount,
          amountPaid: amounts.amountPaid,
          balanceDue: amounts.balanceDue,
          visitDate: parsedDate.date,
          visitDay: parsedDate.dayName,
          notes: notes || null,
        },
      });

      let initialPayment = null;
      if (amounts.amountPaid > 0) {
        initialPayment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: amounts.amountPaid,
            paidOn: new Date(),
            note: 'Initial payment at order placement',
            recordedById: requestingUser.id,
          },
        });
      }

      return {
        ...order,
        payments: initialPayment ? [initialPayment] : [],
      };
    });

    return result;
  }

  /**
   * Record a payment against an existing order (collecting baki later).
   * Reduces balanceDue and increases amountPaid.
   */
  static async recordPayment(
    orderId: string,
    requestingUser: { id: string; role: Role },
    input: CreatePaymentInput
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Role check: salespersons can collect only on their own orders/shops
    if (
      requestingUser.role !== Role.ADMIN &&
      order.salespersonId !== requestingUser.id &&
      order.shop.createdById !== requestingUser.id
    ) {
      throw new ForbiddenError('You can only record payments for your own orders');
    }

    const currentBalanceDue = Number(order.balanceDue);
    const currentAmountPaid = Number(order.amountPaid);

    if (currentBalanceDue <= 0) {
      throw new BadRequestError('This order is already fully paid. No balance due.');
    }

    const { newAmountPaid, newBalanceDue } = calculatePaymentUpdate(
      currentBalanceDue,
      currentAmountPaid,
      input.amountPaid ?? input.amount
    );

    const paymentDate = input.paidOn ? new Date(input.paidOn) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount: input.amount,
          paidOn: paymentDate,
          note: input.note || null,
          recordedById: requestingUser.id,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
        },
        include: {
          payments: {
            orderBy: { paidOn: 'desc' },
          },
        },
      });

      return {
        order: updatedOrder,
        newPayment: payment,
      };
    });

    return result;
  }
}
