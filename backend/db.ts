import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Проверяем наличие DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL не установлен в .env');
}

// Создаем клиент с явной конфигурацией
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});