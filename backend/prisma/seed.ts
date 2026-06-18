// backend/prisma/seed.ts
import dotenv from 'dotenv';
import path from 'path';

// Принудительно вычисляем путь к файлу .env, который лежит на один уровень выше папки prisma
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Извлекаем строку подключения
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Критическая ошибка: Переменная окружения DATABASE_URL не найдена в файле .env');
  console.error('Искали по пути:', path.resolve(__dirname, '../.env'));
  process.exit(1);
}

// Инициализируем драйвер pg.Pool и адаптер для Prisma 7
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Создаем клиент с обязательным адаптером
const seedPrisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Очистка старых данных каталога...');
  await seedPrisma.product.deleteMany({});

  console.log('📦 Наполнение базы данных тестовой номенклатурой...');
  await seedPrisma.product.createMany({
    data: [
      {
        oneCId: '1C-PROD-001',
        name: 'Смартфон NextPhone 15 Pro',
        description: 'Флагманский смартфон на базе Node.js',
        price: 1500,
        stock: 15,
        category: 'Смартфоны'
      },
      {
        oneCId: '1C-PROD-002',
        name: 'Беспроводные наушники DockerPods',
        description: 'Наушники с идеальной изоляцией контейнеров',
        price: 1500,
        stock: 42,
        category: 'Аксессуары'
      },
      {
        oneCId: '1C-PROD-003',
        name: 'Ноутбук PrismaBook Pro 16',
        description: 'Мощный ноутбук для работы с базами данных',
        price: 1000,
        stock: 1, 
        category: 'Ноутбуки'
      }
    ]
  });

  console.log('🌱 База данных успешно наполнена тестовыми товарами!');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Ошибка выполнения сида:', e);
    process.exit(1);
  })  
  .finally(async () => {
    await seedPrisma.$disconnect();
    await pool.end();
  });
