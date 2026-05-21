import 'dotenv/config'; // Загружает данные из .env файла
import { defineConfig } from '@prisma/config'; // Обратите внимание на @

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Используем стандартный Node.js метод для чтения переменной
    url: process.env.DATABASE_URL, 
  },
});
