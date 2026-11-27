import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/response';

interface DecodedToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication token missing or invalid format', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 'Authentication token missing', 401);
      return;
    }

    let decoded: DecodedToken;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload ||
          typeof payload.userId !== 'string' || !payload.userId.trim() ||
          (payload.role !== 'ADMIN' && payload.role !== 'SALESPERSON') ||
          typeof payload.exp !== 'number') {
        sendError(res, 'Invalid authentication token', 401);
        return;
      }
      decoded = payload as DecodedToken;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        sendError(res, 'Authentication token has expired', 401);
        return;
      }
      sendError(res, 'Invalid authentication token', 401);
      return;
    }

    // Business Rule: Check isActive on every request; deactivated users must have tokens rejected
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      sendError(res, 'User account no longer exists', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account is deactivated. Access denied.', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
