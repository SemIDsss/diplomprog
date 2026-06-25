import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // ============================================
  // 1. СОЗДАЁМ КАТЕГОРИИ И ПОДКАТЕГОРИИ (ЕСЛИ ИХ НЕТ)
  // ============================================
  const categoriesData = [
    {
      name: 'Книги',
      subcategories: ['Классика', 'Фантастика', 'Детективы']
    },
    {
      name: 'Мебель',
      subcategories: ['Стулья', 'Столы', 'Шкафы']
    },
    {
      name: 'Игрушки',
      subcategories: ['Мягкие игрушки', 'Конструкторы', 'Настольные игры']
    }
  ];

  for (const catData of categoriesData) {
    // Ищем категорию по имени
    let category = await prisma.category.findUnique({
      where: { name: catData.name },
      include: { subcategories: true }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: catData.name },
        include: { subcategories: true }
      });
      console.log(`✅ Создана категория: "${catData.name}"`);
    }

    // Для каждой подкатегории проверяем, существует ли она
    for (const subName of catData.subcategories) {
      const existingSub = category.subcategories.find(s => s.name === subName);
      if (!existingSub) {
        await prisma.subcategory.create({
          data: {
            name: subName,
            categoryId: category.id
          }
        });
        console.log(`  ✅ Добавлена подкатегория: "${subName}" → "${catData.name}"`);
      }
    }
  }

  // ============================================
  // 2. СОЗДАЁМ ТЕСТОВОГО ПРОДАВЦА (ЕСЛИ ЕГО НЕТ)
  // ============================================
  const sellerEmail = 'seller@test.com';
  let seller = await prisma.user.findUnique({
    where: { email: sellerEmail }
  });

  if (!seller) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    seller = await prisma.user.create({
      data: {
        email: sellerEmail,
        password: hashedPassword,
        role: 'SELLER',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    console.log(`✅ Создан тестовый продавец: ${sellerEmail} (пароль: password123)`);
  } else {
    console.log(`ℹ️ Продавец ${sellerEmail} уже существует`);
  }

  // ============================================
  // 3. ЗАГРУЖАЕМ ТОВАРЫ
  // ============================================
  // Получаем все подкатегории для поиска по имени
  const allSubcategories = await prisma.subcategory.findMany();

  const productsData = [
    { title: '1984', description: 'Культовый роман Джорджа Оруэлла', price: 450, subcategoryName: 'Фантастика', image: '/images/1984.jpg' },
    { title: 'Преступление и наказание', description: 'Великий роман Федора Достоевского', price: 350, subcategoryName: 'Классика', image: '/images/crime.jpg' },
    { title: 'Война и мир', description: 'Эпопея Льва Толстого', price: 500, subcategoryName: 'Классика', image: '/images/war.jpg' },
    { title: 'Мастер и Маргарита', description: 'Мистический роман Михаила Булгакова', price: 400, subcategoryName: 'Классика', image: '/images/master.jpg' },
    { title: 'Деревянный стул', description: 'Стул из массива дуба', price: 2500, subcategoryName: 'Стулья', image: '/images/chair.jpg' },
    { title: 'Офисное кресло', description: 'Удобное кресло с подлокотниками', price: 3500, subcategoryName: 'Стулья', image: '/images/office-chair.jpg' },
    { title: 'Письменный стол', description: 'Стол с ящиками для работы', price: 4500, subcategoryName: 'Столы', image: '/images/desk.jpg' },
    { title: 'Журнальный столик', description: 'Стеклянный столик для гостиной', price: 2800, subcategoryName: 'Столы', image: '/images/coffee-table.jpg' },
    { title: 'Мишка плюшевый', description: 'Мягкая игрушка 50 см', price: 1200, subcategoryName: 'Мягкие игрушки', image: '/images/bear.jpg' },
    { title: 'Зайка', description: 'Плюшевый заяц 40 см', price: 900, subcategoryName: 'Мягкие игрушки', image: '/images/rabbit.jpg' },
    { title: 'LEGO Город', description: 'Конструктор с 500 деталями', price: 3500, subcategoryName: 'Конструкторы', image: '/images/lego-city.jpg' },
    { title: 'LEGO Космос', description: 'Конструктор с 300 деталями', price: 2500, subcategoryName: 'Конструкторы', image: '/images/lego-space.jpg' },
  ];

  let created = 0;
  let skipped = 0;

  for (const product of productsData) {
    const subcategory = allSubcategories.find(s => s.name === product.subcategoryName);
    if (!subcategory) {
      console.log(`⚠️ Подкатегория "${product.subcategoryName}" не найдена, пропускаем`);
      skipped++;
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: { title: product.title }
    });

    if (existing) {
      console.log(`⏭️ Товар "${product.title}" уже существует, пропускаем`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        title: product.title,
        description: product.description,
        price: product.price,
        status: 'APPROVED',
        stock: 999,
        subcategoryId: subcategory.id,
        userId: seller.id,
        image: product.image,
        images: [product.image],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Добавлен товар: "${product.title}" (${product.price} ₽) с картинкой: ${product.image}`);
    created++;
  }

  console.log(`\n📊 Итог: создано ${created} товаров, пропущено ${skipped}`);
  console.log('🎉 Заполнение завершено!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });