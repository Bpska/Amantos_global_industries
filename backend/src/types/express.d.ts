import { Role, User } from '@prisma/client';

export type UserPayload = Omit<User, 'passwordHash'>;

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
