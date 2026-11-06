import { z } from 'zod';

export const createSalespersonSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain alphanumeric characters, dots, underscores and dashes'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().trim().optional().nullable(),
  }),
});

export const updateSalespersonSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid salesperson ID format'),
  }),
  body: z
    .object({
      fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
      phone: z.string().trim().optional().nullable(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field (fullName, phone, isActive) must be provided for update',
    }),
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
  query: z.object({
    page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z.string().optional().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    search: z.string().trim().optional(),
    salespersonId: z.string().uuid('Invalid salesperson UUID').optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD').optional(),
  }),
});

export const adminOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10) || 1)),
    limit: z.string().optional().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10) || 20))),
    salespersonId: z.string().uuid('Invalid salesperson UUID').optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD').optional(),
    status: z.enum(['PAID', 'PARTIAL', 'UNPAID']).optional(),
  }),
});
