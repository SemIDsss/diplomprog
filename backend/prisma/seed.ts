import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';
import 'dotenv/config';

// 1. Получаем строку подключения из окружения
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Ошибка: Переменная окружения DATABASE_URL не задана в файле .env');
  process.exit(1);
}

// 2. Инициализируем стандартный пул соединений PostgreSQL
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Передаем адаптер драйвера в конструктор Prisma v7
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Очистка старых данных перед заполнением...');
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.extremistBook.deleteMany({});

  // 1. Создание категорий и подкатегорий из ТЗ
  const catalogStructure = [
    {
      category: 'Книги',
      subs: ['Манга', 'Раритет', 'Классика'],
    },
    {
      category: 'Мебель',
      subs: ['Кухня', 'Гостинная', 'Дача', 'Спальня', 'Раритет', 'Детская'],
    },
    {
      category: 'Игрушки',
      subs: ['Детские', 'Мягкие', 'Для собак', 'Для кошек'],
    },
  ];

  for (const item of catalogStructure) {
    await prisma.category.create({
      data: {
        name: item.category,
        subcategories: {
          create: item.subs.map((sub) => ({ name: sub })),
        },
      },
    });
  }

  // 2. Наполнение базы запрещенных книг для фильтра администратора
  const forbiddenBooks = ['Запрещенная книга 1', 'Манифест Экстремизма', 'Терроризм и хаос'];
  for (const title of forbiddenBooks) {
    await prisma.extremistBook.create({
      data: { title },
    });
  }

  // 3. Создание одного главного администратора разработчика
  await prisma.user.upsert({
    where: { email: 'admin@diplom.ru' },
    update: {},
    create: {
      email: 'admin@diplom.ru',
      role: 'ADMIN',
    },
  });

  console.log('Данные каталога, экстремистских книг и суперадмина успешно добавлены!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Корректно закрываем соединения
    await prisma.$disconnect();
    await pool.end();
  });
