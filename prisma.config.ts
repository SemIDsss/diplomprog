import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL отсутствует в .env');
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL
  }
});
