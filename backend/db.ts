import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

let connectionString = process.env.DATABASE_URL;

// ИСПРАВЛЕНО: Автоматическое переключение портов, если сервер уходит внутрь Docker-сети
if (process.env.NODE_ENV === 'production' && connectionString) {
  connectionString = connectionString.replace('localhost:5433', 'postgres_db:5432');
}

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env file');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { pool };

