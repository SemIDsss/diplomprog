import 'dotenv/config'; 
import { prisma } from '../db'; 

async function main() {
  console.log('⏳ Очистка старых данных перед заполнением...');
  
  
  await prisma.product.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('🌱 Наполнение базы данных актуальными категориями и товарами...');

  
  const books = await prisma.category.create({
    data: {
      name: 'Книги',
      subcategories: {
        create: [
          { name: 'Учебная литература' },
          { name: 'Художественная литература' },
        ],
      },
    },
    include: { subcategories: true },
  });

 
  const toys = await prisma.category.create({
    data: {
      name: 'Игрушки',
      subcategories: {
        create: [
          { name: 'Развивающие игры' },
          { name: 'Мягкие игрушки' },
        ],
      },
    },
    include: { subcategories: true },
  });

  
  const furniture = await prisma.category.create({
    data: {
      name: 'Мебель',
      subcategories: {
        create: [
          { name: 'Офисная мебель' },
          { name: 'Мягкая мебель' },
        ],
      },
    },
    include: { subcategories: true },
  });

  // Получаем ID подкатегорий
  const fictionId = books.subcategories.find(s => s.name === 'Художественная литература')?.id!;
  const educationalId = books.subcategories.find(s => s.name === 'Учебная литература')?.id!;
  const devToysId = toys.subcategories.find(s => s.name === 'Развивающие игры')?.id!;
  const softToysId = toys.subcategories.find(s => s.name === 'Мягкие игрушки')?.id!;
  const officeFurnitureId = furniture.subcategories.find(s => s.name === 'Офисная мебель')?.id!;
  const softFurnitureId = furniture.subcategories.find(s => s.name === 'Мягкая мебель')?.id!;

  
  await prisma.product.createMany({
    data: [
      {
        title: 'Классический Роман "Время"',
        description: 'Подарочное издание мирового бестселлера в твердом переплете.',
        price: 850,
        status: 'APPROVED',
        subcategoryId: fictionId,
      },
      {
        title: 'Учебник по TypeScript',
        description: 'Полное руководство от базовых типов до продвинутой архитектуры.',
        price: 2450,
        status: 'APPROVED',
        subcategoryId: educationalId,
      },
      {
        title: 'Деревянный конструктор-головоломка',
        description: 'Развивающий набор для моделирования пространственного мышления.',
        price: 1890,
        status: 'APPROVED',
        subcategoryId: devToysId,
      },
      {
        title: 'Плюшевый Медведь',
        description: 'Гипоаллергенная мягкая игрушка высотой 50 см.',
        price: 3200,
        status: 'APPROVED',
        subcategoryId: softToysId,
      },
      {
        title: 'Офисное Кресло Aero',
        description: 'Анатомическая поддержка спины и регулировка подлокотников.',
        price: 14500,
        status: 'APPROVED',
        subcategoryId: officeFurnitureId,
      },
      {
        title: 'Диван Трехместный Сканди',
        description: 'Стильный велюровый диван с механизмом трансформации.',
        price: 42000,
        status: 'APPROVED',
        subcategoryId: softFurnitureId,
      },
    ],
  });

  console.log('✨ База данных маркетплейса успешно заполнена книгами, игрушками и мебелью!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при выполнении сида:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
