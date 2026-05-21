import 'dotenv/config'; // Должно быть строго на первой строке!
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// ... далее весь остальной код без изменений


const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Очищаем старые данные, если они были
  await prisma.product.deleteMany({});

  // Добавляем тестовые товары, как будто они пришли из 1С
  await prisma.product.createMany({
    data: [
      {
        oneCId: '1C-PROD-001',
        name: 'Смартфон NextPhone 15 Pro',
        description: 'Флагманский смартфон на базе Node.js',
        price: 1,
        stock: 15,
        category: 'Смартфоны'
      },
      {
        oneCId: '1C-PROD-002',
        name: 'Беспроводные наушники DockerPods',
        description: 'Наушники с идеальной изоляцией контейнеров',
        price: 1,
        stock: 42,
        category: 'Аксессуары'
      },
      {
        oneCId: '1C-PROD-003',
        name: 'Ноутбук PrismaBook Pro 16',
        description: 'Мощный ноутбук для работы с базами данных',
        price: 1,
        stock: 0, // Имитируем отсутствие товара на складе 1С
        category: 'Ноутбуки'
      }
    ]
  });

  console.log('🌱 База данных успешно наполнена тестовыми товарами!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
