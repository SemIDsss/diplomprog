import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/index.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(__dirname, '.env')
});

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL missing');
}

const pool = new Pool({
  connectionString: dbUrl
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
export { pool };
