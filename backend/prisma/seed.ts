import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // ============================================
  // 1. КАТЕГОРИИ И ПОДКАТЕГОРИИ
  // ============================================
  const categoriesData = [
    {
      name: 'Книги',
      subcategories: ['Классика', 'Фантастика', 'Детективы'],
    },
    {
      name: 'Мебель',
      subcategories: ['Стулья', 'Столы', 'Шкафы'],
    },
    {
      name: 'Игрушки',
      subcategories: ['Мягкие игрушки', 'Конструкторы', 'Настольные игры'],
    },
  ];

  for (const catData of categoriesData) {
    let category = await prisma.category.findUnique({
      where: { name: catData.name },
      include: { subcategories: true },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: catData.name },
        include: { subcategories: true },
      });
      console.log(`✅ Создана категория: "${catData.name}"`);
    }

    for (const subName of catData.subcategories) {
      const existingSub = category.subcategories.find((s) => s.name === subName);
      if (!existingSub) {
        await prisma.subcategory.create({
          data: { name: subName, categoryId: category.id },
        });
        console.log(`  ✅ Добавлена подкатегория: "${subName}" → "${catData.name}"`);
      }
    }
  }

  // ============================================
  // 2. ПОЛЬЗОВАТЕЛИ
  // ============================================
  const users = [
    { email: 'admin@test.com', role: Role.ADMIN, password: 'admin123' },
    { email: 'seller@test.com', role: Role.SELLER, password: 'seller123' },
    { email: 'buyer@test.com', role: Role.USER, password: 'buyer123' },
    { email: 'buyer2@test.com', role: Role.USER, password: 'buyer123' },
  ];

  const createdUsers: { [email: string]: any } = {};

  for (const u of users) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      const hashed = await bcrypt.hash(u.password, 10);
      user = await prisma.user.create({
        data: {
          email: u.email,
          password: hashed,
          role: u.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Создан пользователь: ${u.email} (${u.role})`);
    } else {
      console.log(`ℹ️ Пользователь ${u.email} уже существует`);
    }
    createdUsers[u.email] = user;
  }

  const seller = createdUsers['seller@test.com'];
  const buyer = createdUsers['buyer@test.com'];
  const buyer2 = createdUsers['buyer2@test.com'];

  // ============================================
  // 3. ТОВАРЫ (все 12, с полным набором полей)
  // ============================================
  const allSubcategories = await prisma.subcategory.findMany();

  // Полный список товаров из задания
  const productsData = [
    {
      title: '1984',
      description: 'Культовый роман Джорджа Оруэлла',
      price: 450,
      subcategoryName: 'Фантастика',
      image: '/images/1984.jpg',
      sku: 'BOOK-001',
      brand: 'АСТ',
      material: 'Бумага',
      color: 'Белый',
      weight: 0.3,
      width: 13,
      height: 20,
      depth: 2,
      year: 2020,
      country: 'Россия',
      season: 'Всесезонный',
      collection: 'Классика',
      stock: 50,
    },
    {
      title: 'Преступление и наказание',
      description: 'Великий роман Федора Достоевского',
      price: 350,
      subcategoryName: 'Классика',
      image: '/images/crime.jpg',
      sku: 'BOOK-002',
      brand: 'Эксмо',
      material: 'Бумага',
      color: 'Серый',
      weight: 0.4,
      width: 14,
      height: 21,
      depth: 2.5,
      year: 2019,
      country: 'Россия',
      season: 'Всесезонный',
      collection: 'Школьная',
      stock: 30,
    },
    {
      title: 'Война и мир',
      description: 'Эпопея Льва Толстого',
      price: 500,
      subcategoryName: 'Классика',
      image: '/images/war.jpg',
      sku: 'BOOK-003',
      brand: 'Эксмо',
      material: 'Бумага',
      color: 'Бежевый',
      weight: 0.6,
      width: 15,
      height: 22,
      depth: 3,
      year: 2018,
      country: 'Россия',
      season: 'Всесезонный',
      collection: 'Золотая коллекция',
      stock: 25,
    },
    {
      title: 'Мастер и Маргарита',
      description: 'Мистический роман Михаила Булгакова',
      price: 400,
      subcategoryName: 'Классика',
      image: '/images/master.jpg',
      sku: 'BOOK-004',
      brand: 'Азбука',
      material: 'Бумага',
      color: 'Кремовый',
      weight: 0.35,
      width: 13.5,
      height: 20.5,
      depth: 2.2,
      year: 2021,
      country: 'Россия',
      season: 'Всесезонный',
      collection: 'Шедевры',
      stock: 40,
    },
    {
      title: 'Деревянный стул',
      description: 'Стул из массива дуба',
      price: 2500,
      subcategoryName: 'Стулья',
      image: '/images/chair.jpg',
      sku: 'FURN-001',
      brand: 'Мебель-Мастер',
      material: 'Дуб',
      color: 'Коричневый',
      weight: 5.2,
      width: 45,
      height: 90,
      depth: 45,
      year: 2023,
      country: 'Россия',
      season: 'Всесезонный',
      collection: 'Классика',
      stock: 15,
    },
    {
      title: 'Офисное кресло',
      description: 'Удобное кресло с подлокотниками',
      price: 3500,
      subcategoryName: 'Стулья',
      image: '/images/office-chair.jpg',
      sku: 'FURN-002',
      brand: 'Comfort',
      material: 'Ткань, металл',
      color: 'Черный',
      weight: 8.0,
      width: 60,
      height: 110,
      depth: 60,
      year: 2024,
      country: 'Китай',
      season: 'Всесезонный',
      collection: 'Офисная',
      stock: 10,
    },
    {
      title: 'Письменный стол',
      description: 'Стол с ящиками для работы',
      price: 4500,
      subcategoryName: 'Столы',
      image: '/images/desk.jpg',
      sku: 'FURN-003',
      brand: 'WoodLine',
      material: 'ДСП, МДФ',
      color: 'Белый',
      weight: 15.0,
      width: 120,
      height: 75,
      depth: 60,
      year: 2023,
      country: 'Россия',
      season: 'Всесезонный',
      collection: 'Офисная',
      stock: 8,
    },
    {
      title: 'Журнальный столик',
      description: 'Стеклянный столик для гостиной',
      price: 2800,
      subcategoryName: 'Столы',
      image: '/images/coffee-table.jpg',
      sku: 'FURN-004',
      brand: 'GlassArt',
      material: 'Стекло, металл',
      color: 'Прозрачный',
      weight: 4.5,
      width: 90,
      height: 45,
      depth: 50,
      year: 2022,
      country: 'Италия',
      season: 'Всесезонный',
      collection: 'Современная',
      stock: 12,
    },
    {
      title: 'Мишка плюшевый',
      description: 'Мягкая игрушка 50 см',
      price: 1200,
      subcategoryName: 'Мягкие игрушки',
      image: '/images/bear.jpg',
      sku: 'TOY-001',
      brand: 'Teddy',
      material: 'Искусственный мех',
      color: 'Коричневый',
      weight: 0.4,
      width: 25,
      height: 50,
      depth: 20,
      year: 2024,
      country: 'Китай',
      season: 'Всесезонный',
      collection: 'Классика',
      stock: 30,
    },
    {
      title: 'Зайка',
      description: 'Плюшевый заяц 40 см',
      price: 900,
      subcategoryName: 'Мягкие игрушки',
      image: '/images/rabbit.jpg',
      sku: 'TOY-002',
      brand: 'Bunny',
      material: 'Искусственный мех',
      color: 'Белый',
      weight: 0.3,
      width: 20,
      height: 40,
      depth: 15,
      year: 2024,
      country: 'Китай',
      season: 'Всесезонный',
      collection: 'Классика',
      stock: 45,
    },
    {
      title: 'LEGO Город',
      description: 'Конструктор с 500 деталями',
      price: 3500,
      subcategoryName: 'Конструкторы',
      image: '/images/lego-city.jpg',
      sku: 'TOY-003',
      brand: 'LEGO',
      material: 'Пластик',
      color: 'Разноцветный',
      weight: 1.2,
      width: 38,
      height: 26,
      depth: 7,
      year: 2024,
      country: 'Дания',
      season: 'Всесезонный',
      collection: 'City',
      stock: 20,
    },
    {
      title: 'LEGO Космос',
      description: 'Конструктор с 300 деталями',
      price: 2500,
      subcategoryName: 'Конструкторы',
      image: '/images/lego-space.jpg',
      sku: 'TOY-004',
      brand: 'LEGO',
      material: 'Пластик',
      color: 'Разноцветный',
      weight: 0.9,
      width: 35,
      height: 24,
      depth: 6,
      year: 2023,
      country: 'Дания',
      season: 'Всесезонный',
      collection: 'Space',
      stock: 25,
    },
  ];

  let created = 0;
  for (const product of productsData) {
    const subcategory = allSubcategories.find((s) => s.name === product.subcategoryName);
    if (!subcategory) {
      console.log(`⚠️ Подкатегория "${product.subcategoryName}" не найдена, пропускаем`);
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: { title: product.title },
    });

    if (existing) {
      console.log(`⏭️ Товар "${product.title}" уже существует, пропускаем`);
      continue;
    }

    await prisma.product.create({
      data: {
        title: product.title,
        description: product.description,
        price: product.price,
        status: 'APPROVED',
        stock: product.stock,
        subcategoryId: subcategory.id,
        userId: seller.id,
        image: product.image,
        images: [product.image],
        sku: product.sku,
        brand: product.brand,
        material: product.material,
        color: product.color,
        weight: product.weight,
        width: product.width,
        height: product.height,
        depth: product.depth,
        year: product.year,
        country: product.country,
        season: product.season,
        collection: product.collection,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Добавлен товар: "${product.title}" (${product.price} ₽)`);
    created++;
  }

  console.log(`📦 Всего создано товаров: ${created}`);

  // ============================================
  // 4. ЗАКАЗЫ (для теста оплаты)
  // ============================================
  const allProducts = await prisma.product.findMany();
  if (allProducts.length >= 2) {
    // Заказ 1 (PENDING) для buyer
    await prisma.order.create({
      data: {
        userId: buyer.id,
        totalAmount: allProducts[0].price + allProducts[1].price,
        deliveryMethod: 'СДЭК',
        deliveryPrice: 350,
        status: OrderStatus.PENDING,
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: [
            { productId: allProducts[0].id, quantity: 1, price: allProducts[0].price },
            { productId: allProducts[1].id, quantity: 1, price: allProducts[1].price },
          ],
        },
      },
    });
    console.log('✅ Создан тестовый заказ (PENDING) для buyer');

    // Заказ 2 (APPROVED) для buyer2
    if (allProducts.length >= 3) {
      await prisma.order.create({
        data: {
          userId: buyer2.id,
          totalAmount: allProducts[2].price,
          deliveryMethod: 'Boxberry',
          deliveryPrice: 250,
          status: OrderStatus.APPROVED,
          paymentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: {
            create: [{ productId: allProducts[2].id, quantity: 1, price: allProducts[2].price }],
          },
        },
      });
      console.log('✅ Создан тестовый заказ (APPROVED) для buyer2');
    }
  }

  // ============================================
  // 5. ОТЗЫВЫ (на первый товар)
  // ============================================
  if (allProducts.length > 0) {
    await prisma.review.createMany({
      data: [
        {
          productId: allProducts[0].id,
          userName: 'Иван Петров',
          rating: 5,
          comment: 'Отличная книга!',
          createdAt: new Date(),
        },
        {
          productId: allProducts[0].id,
          userName: 'Мария Смирнова',
          rating: 4,
          comment: 'Интересно, но немного затянуто',
          createdAt: new Date(),
        },
      ],
    });
    console.log('✅ Добавлены отзывы на первый товар');
  }

  // ============================================
  // 6. КОРЗИНА (для buyer)
  // ============================================
  if (allProducts.length >= 3) {
    // Удаляем старые записи корзины для этого пользователя (чтобы избежать дублей)
    await prisma.cartItem.deleteMany({
      where: { userId: buyer.id },
    });

    // Добавляем новые товары в корзину
    await prisma.cartItem.createMany({
      data: [
        { userId: buyer.id, productId: allProducts[0].id, quantity: 2 },
        { userId: buyer.id, productId: allProducts[2].id, quantity: 1 },
      ],
    });
    console.log('✅ Добавлены товары в корзину для buyer');
  }

  console.log('🎉 Заполнение базы данных завершено!');
}
const updateStock = await prisma.product.updateMany({
  data: { stock: 10000 },
});
console.log(`✅ Обновлён остаток у ${updateStock.count} товаров до 100`);
main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });