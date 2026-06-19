import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// 1. Принудительно загружаем .env файл
const backendDir = process.cwd(); 
dotenv.config({ path: path.resolve(backendDir, '.env') });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };


const pool = new Pool({
  user: 'admin',
  password: 'rootpassword',
  host: 'localhost',
  port: 5433,        
  database: 'dev_db' 
});

// Навешиваем обработчик ошибок на пул, чтобы сервер не падал при обрыве связи
pool.on('error', (err) => {
  console.error('Непредвиденная ошибка в пуле PostgreSQL:', err);
});

const adapter = new PrismaPg(pool);

// 3. Инициализируем клиент Prisma 7 через адаптер
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
