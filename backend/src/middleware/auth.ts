import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    console.log('🔍 authMiddleware: token =', token ? 'present' : 'missing');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isBlocked: true },
    });

    if (!user || user.isBlocked) {
      res.clearCookie('token');
      return next();
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    console.log('✅ authMiddleware: user set', req.user.email);
    next();
  } catch (error) {
    console.warn('Auth middleware error:', error);
    next();
  }
};

export const graphqlContext = async ({ req, res }: { req: Request; res: Response }) => {
  console.log('📦 graphqlContext: req.cookies =', req.cookies);
  if (!req) return { user: null, res };

  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  let user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, isBlocked: true },
      });
      if (dbUser && !dbUser.isBlocked) {
        user = { userId: dbUser.id, email: dbUser.email, role: dbUser.role };
        console.log('✅ graphqlContext: user found', user.email);
      }
    } catch (e) {
      console.warn('graphqlContext: token verification failed', e);
    }
  }

  return { user, res };
};