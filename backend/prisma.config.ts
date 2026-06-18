// backend/prisma.config.ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma', 
  
  migrations: {
    path: 'prisma/migrations',
    // ИСПРАВЛЕНИЕ: убираем проблемный флаг node, оставляем чистый запуск
    seed: 'tsx prisma/seed.ts', 
  },
  
  datasource: {
    url: process.env.DATABASE_URL || '', 
  },
});
