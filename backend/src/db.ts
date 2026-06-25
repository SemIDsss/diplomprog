import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL не задан в .env');
}

export const prisma = new PrismaClient();