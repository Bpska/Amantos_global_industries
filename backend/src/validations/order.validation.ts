import { z } from 'zod';

export const createRepeatOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shop ID format'),
  }),
  body: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        productName: val.productName || val.product || 'Mixture Pack',
        billingType: val.billingType || 'ONLINE',
        visitDate: val.visitDate || val.date,
        quantity: val.quantity !== undefined ? Number(val.quantity) : undefined,
        unitPrice: val.unitPrice !== undefined ? Number(val.unitPrice) : undefined,
        amountPaid: val.amountPaid !== undefined ? Number(val.amountPaid) : undefined,
      };
    }
    return val;
  }, z.object({
    productName: z.string().trim().default('Mixture Pack'),
    billingType: z.enum(['ONLINE', 'PHYSICAL']).default('ONLINE').optional(),
    quantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than 0'),
    unitPrice: z.number().positive('Unit price must be greater than 0'),
    amountPaid: z.number().min(0, 'Amount paid cannot be negative').default(0),
    visitDate: z.string().optional(),
    notes: z.string().trim().optional().nullable(),
  })),
});

export const createPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID format'),
  }),
  body: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        amount: val.amount !== undefined ? Number(val.amount) : undefined,
      };
    }
    return val;
  }, z.object({
    amount: z.number().positive('Payment amount must be greater than 0'),
    paidOn: z.string().optional(),
    note: z.string().trim().optional().nullable(),
  })),
});

export type CreateRepeatOrderInput = z.infer<typeof createRepeatOrderSchema>['body'];
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
