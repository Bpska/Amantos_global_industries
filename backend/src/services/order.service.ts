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

    const productName = input.productName || (input as any).product || 'Mixture Pack';
    const billingType = (input as any).billingType || 'ONLINE';
    const visitDate = input.visitDate || (input as any).date;
    const {
      quantity,
      unitPrice,
      amountPaid = 0,
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
          billingType: billingType === 'PHYSICAL' ? 'PHYSICAL' : 'ONLINE',
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

      const ordPaid = amounts.amountPaid;
      const ordBaki = amounts.balanceDue;
      const ordTotal = amounts.totalAmount;
      const ordStatus = ordBaki === 0 ? 'PAID' : (ordPaid > 0 ? 'PARTIAL' : 'UNPAID');

      return {
        ...order,
        id: order.id,
        invoiceNumber: `INV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`,
        billingType: order.billingType || 'ONLINE',
        product: order.productName,
        productName: order.productName,
        quantity: order.quantity,
        unitPrice: Number(order.unitPrice),
        totalAmount: ordTotal,
        amountPaid: ordPaid,
        paidAmount: ordPaid,
        balanceDue: ordBaki,
        baki: ordBaki,
        status: ordStatus,
        date: order.visitDate.toISOString(),
        visitDate: order.visitDate.toISOString(),
        visitDay: order.visitDay,
        payments: initialPayment
          ? [
              {
                id: initialPayment.id,
                amount: Number(initialPayment.amount),
                createdAt: initialPayment.paidOn.toISOString(),
                paidOn: initialPayment.paidOn.toISOString(),
                note: initialPayment.note,
              },
            ]
          : [],
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
      input.amount
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

      const ordPaid = Number(updatedOrder.amountPaid);
      const ordBaki = Number(updatedOrder.balanceDue);
      const ordTotal = Number(updatedOrder.totalAmount);
      const ordStatus = ordBaki === 0 ? 'PAID' : (ordPaid > 0 ? 'PARTIAL' : 'UNPAID');

      const formattedOrder = {
        ...updatedOrder,
        id: updatedOrder.id,
        product: updatedOrder.productName,
        productName: updatedOrder.productName,
        quantity: updatedOrder.quantity,
        unitPrice: Number(updatedOrder.unitPrice),
        totalAmount: ordTotal,
        amountPaid: ordPaid,
        paidAmount: ordPaid,
        balanceDue: ordBaki,
        baki: ordBaki,
        status: ordStatus,
        date: updatedOrder.visitDate.toISOString(),
        visitDate: updatedOrder.visitDate.toISOString(),
        visitDay: updatedOrder.visitDay,
        payments: updatedOrder.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          createdAt: p.paidOn.toISOString(),
          paidOn: p.paidOn.toISOString(),
          note: p.note,
        })),
      };

      return {
        order: formattedOrder,
        newPayment: {
          id: payment.id,
          amount: Number(payment.amount),
          createdAt: payment.paidOn.toISOString(),
          paidOn: payment.paidOn.toISOString(),
          note: payment.note,
        },
      };
    });

    return result;
  }
}
