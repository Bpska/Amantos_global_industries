import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { env } from '../src/config/env';
import { Role } from '@prisma/client';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    shop: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
  },
}));

describe('Authentication & Role-Based Access Control', () => {
  const app = createApp();

  const mockAdminUser = {
    id: 'admin-uuid-1234',
    username: 'admin',
    fullName: 'Administrator',
    phone: '9999999999',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSalespersonUser = {
    id: 'sp-uuid-5678',
    username: 'sp_rajesh',
    fullName: 'Rajesh Kumar',
    phone: '9876543210',
    role: Role.SALESPERSON,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeactivatedUser = {
    ...mockSalespersonUser,
    isActive: false,
  };

  const generateToken = (userId: string, role: Role) => {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '7d' });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Authentication Middleware', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token missing');
    });

    it('returns 401 when Authorization token is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid authentication token');
    });

    it('returns 401 and rejects existing token if user is deactivated (isActive = false)', async () => {
      const token = generateToken(mockDeactivatedUser.id, mockDeactivatedUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDeactivatedUser);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Account is deactivated');
    });

    it('returns 200 when token is valid and user is active', async () => {
      const token = generateToken(mockSalespersonUser.id, mockSalespersonUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSalespersonUser);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('sp_rajesh');
    });
  });

  describe('Role Authorization (Admin vs Salesperson)', () => {
    it('returns 403 Forbidden when a Salesperson tries to access Admin endpoints', async () => {
      const spToken = generateToken(mockSalespersonUser.id, mockSalespersonUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSalespersonUser);

      const res = await request(app)
        .get('/api/v1/admin/salespersons')
        .set('Authorization', `Bearer ${spToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('is not authorized');
    });

    it('allows Admin to access Admin endpoints', async () => {
      const adminToken = generateToken(mockAdminUser.id, mockAdminUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/admin/salespersons')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('allows Salesperson to access salesperson-specific summary endpoint', async () => {
      const spToken = generateToken(mockSalespersonUser.id, mockSalespersonUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSalespersonUser);
      (prisma.shop.count as jest.Mock).mockResolvedValue(3);
      (prisma.order.count as jest.Mock).mockResolvedValue(5);
      (prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: {
          totalAmount: 2500,
          amountPaid: 1500,
          balanceDue: 1000,
        },
      });

      const res = await request(app)
        .get('/api/v1/me/summary')
        .set('Authorization', `Bearer ${spToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shopsCount).toBe(3);
      expect(res.body.data.totalSales).toBe(2500);
      expect(res.body.data.totalBaki).toBe(1000);
    });
  });
});
