import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  const categories = await prisma.category.findMany({
    include: { subcategories: true }
  });

  if (categories.length === 0) {
    console.log('❌ Нет категорий! Сначала создайте категории.');
    return;
  }

  const firstUser = await prisma.user.findFirst();
  if (!firstUser) {
    console.log('❌ Нет пользователей! Сначала зарегистрируйтесь.');
    return;
  }

  // ✅ В КАЖДОМ ТОВАРЕ УКАЗАНА ПОДКАТЕГОРИЯ
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
    // Находим подкатегорию по имени
    const subcategory = categories
      .flatMap(c => c.subcategories)
      .find(s => s.name === product.subcategoryName);

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
        subcategoryId: subcategory.id,
        userId: firstUser.id,
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