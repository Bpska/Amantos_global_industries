import { z } from 'zod';

export const onboardShopSchema = z.object({
  body: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        shopName: val.shopName || val.name,
        productName: val.openingOrderProduct || val.productName || val.product || 'Mixture Pack 500g',
        billingType: val.billingType || 'ONLINE',
        visitDate: val.visitDate || val.date,
        quantity: val.openingOrderQuantity !== undefined ? Number(val.openingOrderQuantity) : val.quantity !== undefined ? Number(val.quantity) : 1,
        unitPrice: val.openingOrderPrice !== undefined ? Number(val.openingOrderPrice) : val.unitPrice !== undefined ? Number(val.unitPrice) : 10,
        amountPaid: val.initialPaidAmount !== undefined ? Number(val.initialPaidAmount) : val.amountPaid !== undefined ? Number(val.amountPaid) : 0,
      };
    }
    return val;
  }, z.object({
    shopName: z.string().trim().min(1, 'Shop name is required'),
    location: z.string().trim().min(1, 'Location is required'),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    ownerName: z.string().trim().min(1, 'Owner name is required'),
    contactNumber: z.string().trim().min(5, 'Valid contact number is required'),
    salespersonId: z.string().optional().nullable(),
    productName: z.string().trim().default('Mixture Pack 500g'),
    billingType: z.enum(['ONLINE', 'PHYSICAL']).default('ONLINE').optional(),
    quantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than 0').default(1),
    unitPrice: z.number().positive('Unit price must be greater than 0').default(10),
    amountPaid: z.number().min(0, 'Amount paid cannot be negative').default(0),
    visitDate: z.string().optional(),
    notes: z.string().trim().optional().nullable(),
  })),
});

export const shopIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shop ID format'),
  }),
});

export const shopsMineQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z.string().optional().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
  }),
});

export type OnboardShopInput = z.infer<typeof onboardShopSchema>['body'];
