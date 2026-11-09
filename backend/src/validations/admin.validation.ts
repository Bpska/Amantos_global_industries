import { z } from 'zod';

export const createSalespersonSchema = z.object({
  body: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        fullName: val.fullName || val.name,
      };
    }
    return val;
  }, z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain alphanumeric characters, dots, underscores and dashes'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().trim().optional().nullable(),
  })),
});

export const updateSalespersonSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid salesperson ID format'),
  }),
  body: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      const res: any = { ...val };
      if (val.name && !val.fullName) res.fullName = val.name;
      if (val.active !== undefined && val.isActive === undefined) res.isActive = val.active;
      return res;
    }
    return val;
  }, z
    .object({
      fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
      phone: z.string().trim().optional().nullable(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field (fullName, phone, isActive) must be provided for update',
    })),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid salesperson ID format'),
  }),
  body: z.object({
    password: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
});

export const adminShopsQuerySchema = z.object({
  query: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      const res = { ...val };
      if (val.from && !val.startDate) res.startDate = String(val.from).split('T')[0];
      if (val.to && !val.endDate) res.endDate = String(val.to).split('T')[0];
      return res;
    }
    return val;
  }, z.object({
    page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z.string().optional().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    search: z.string().trim().optional(),
    status: z.string().trim().optional(),
    salespersonId: z.string().uuid('Invalid salesperson UUID').optional().or(z.literal('')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })),
});

export const adminOrdersQuerySchema = z.object({
  query: z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
      const res = { ...val };
      if (val.from && !val.startDate) res.startDate = String(val.from).split('T')[0];
      if (val.to && !val.endDate) res.endDate = String(val.to).split('T')[0];
      return res;
    }
    return val;
  }, z.object({
    page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z.string().optional().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    salespersonId: z.string().uuid('Invalid salesperson UUID').optional().or(z.literal('')),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['PAID', 'PARTIAL', 'UNPAID']).optional().or(z.literal('')),
  })),
});
