import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { env } from '../src/config/env';
import { Role } from '@prisma/client';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
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
    it('rejects expired tokens before looking up the account', async () => {
      const token = jwt.sign({ userId: mockAdminUser.id, role: Role.ADMIN }, env.JWT_SECRET, { expiresIn: -1 });
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('expired');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects signed tokens with missing claims instead of returning a database error', async () => {
      const token = jwt.sign({ role: Role.ADMIN }, env.JWT_SECRET, { expiresIn: '1h' });
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a token belonging to a deleted user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const res = await request(app).get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${generateToken(mockAdminUser.id, Role.ADMIN)}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('no longer exists');
    });

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
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('Login and profile restoration', () => {
    it('returns a usable token and restores the same account', async () => {
      const passwordHash = await bcrypt.hash('ActualPassword@123', 4);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockAdminUser, passwordHash });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
      const login = await request(app).post('/api/v1/auth/login')
        .send({ username: ' ADMIN ', password: 'ActualPassword@123' });
      expect(login.status).toBe(200);
      expect(login.body.data.user.passwordHash).toBeUndefined();
      const profile = await request(app).get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.data.token}`);
      expect(profile.status).toBe(200);
      expect(profile.body.data.id).toBe(mockAdminUser.id);
    });

    it.each(['admin@123', 'AdminPassword@123', 'incorrect'])('rejects %s when it does not match the stored admin password', async (password) => {
      const passwordHash = await bcrypt.hash('ChangedPassword@123', 4);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockAdminUser, passwordHash });
      const res = await request(app).post('/api/v1/auth/login').send({ username: 'admin', password });
      expect(res.status).toBe(401);
      expect(res.body.data?.token).toBeUndefined();
    });
  });

  describe('Password management is restricted to administrators', () => {
    const passwordRoutes = [
      ['post', '/api/v1/auth/change-password'],
      ['patch', '/api/v1/auth/password'],
    ] as const;

    it.each(passwordRoutes)('rejects salesperson password changes via %s %s', async (method, path) => {
      const token = generateToken(mockSalespersonUser.id, mockSalespersonUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSalespersonUser);

      const res = await request(app)[method](path)
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'Current@123', newPassword: 'Replacement@123' });

      expect(res.status).toBe(403);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it.each(passwordRoutes)('allows an administrator to change their own password via %s %s', async (method, path) => {
      const token = generateToken(mockAdminUser.id, mockAdminUser.role);
      const passwordHash = await bcrypt.hash('Current@123', 4);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockAdminUser, passwordHash });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockAdminUser);

      const res = await request(app)[method](path)
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'Current@123', newPassword: 'Replacement@123' });

      expect(res.status).toBe(200);
      const update = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(update.where.id).toBe(mockAdminUser.id);
      expect(await bcrypt.compare('Replacement@123', update.data.passwordHash)).toBe(true);
    });

    it('rejects salesperson access to the administrator password reset endpoint', async () => {
      const token = generateToken(mockSalespersonUser.id, mockSalespersonUser.role);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSalespersonUser);

      const res = await request(app)
        .post('/api/v1/admin/salespersons/11111111-1111-4111-8111-111111111111/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Replacement@123' });

      expect(res.status).toBe(403);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows an administrator to reset a salesperson password', async () => {
      const salespersonId = '11111111-1111-4111-8111-111111111111';
      const token = generateToken(mockAdminUser.id, mockAdminUser.role);
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdminUser)
        .mockResolvedValueOnce({ ...mockSalespersonUser, id: salespersonId });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post(`/api/v1/admin/salespersons/${salespersonId}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'Replacement@123' });

      expect(res.status).toBe(200);
      const update = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(update.where.id).toBe(salespersonId);
      expect(await bcrypt.compare('Replacement@123', update.data.passwordHash)).toBe(true);
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
