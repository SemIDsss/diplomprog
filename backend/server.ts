import 'dotenv/config'; // Обязательно загружаем переменные из .env
import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import { PrismaClient } from './generated/client'; //
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwtStandard from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Импортируем модули доставки и оплаты
import { shippingRouter } from './shipping';
import { paymentRouter } from './payment'; // <-- Добавлен импорт роутера оплаты из payment.ts

// Инициализируем пул pg и адаптер Prisma 7 для бэкенда
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const app = express();

// Конфигурация мидлварей в строгом порядке
app.use(cors()); // 1. Обязательно активируем CORS первым делом!
app.use(express.json()); // 2. Читаем JSON-тело запросов

// Подключаем наши обработчики к серверу Express
app.use(shippingRouter); // 3. Модуль расчета СДЭК / Boxberry
app.use(paymentRouter);  // 4. Модуль оплаты ЮKassa / СБП одной кнопкой

// ==========================================
// 1. REST API: Интеграции, Заказы и Оплата
// ==========================================

// АВТОРИЗАЦИЯ: Регистрация нового пользователя
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const candidate = await prisma.user.findUnique({ where: { email } });
    if (candidate) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
});
app.post('/api/products/review', async (req, res) => {
  try {
    const { productId, userName, rating, comment } = req.body;
    
    const review = await prisma.review.create({
      data: {
        productId: parseInt(productId),
        userName,
        rating: parseInt(rating),
        comment
      }
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Не удалось оставить отзыв' });
  }
});


// АВТОРИЗАЦИЯ: Вход (Логин)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    const token = jwtStandard.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});
// REST API: Добавление нового товара продавцом
app.post('/api/products/create', async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    // Генерируем фейковый 1С ID для товаров, созданных вручную на сайте
    const { v4: uuidv4 } = require('uuid');
    const oneCId = `WEB-${uuidv4().substring(0, 8).toUpperCase()}`;

    const newProduct = await prisma.product.create({
      data: {
        oneCId,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category
      }
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({ message: 'Не удалось добавить товар в каталог' });
  }
});
// REST API: Удаление товара
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Товар успешно удален' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ message: 'Не удалось удалить товар' });
  }
});

// REST API: Редактирование товара
app.put('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, price, stock, category, image } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        image // сохраняем URL картинки
      }
    });

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ message: 'Не удалось обновить товар' });
  }
});

// REST API: Получение истории заказов конкретного пользователя
app.get('/api/orders/history/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Некорректный ID пользователя' });
    }

    // Ищем все заказы пользователя, сортируя от новых к старым
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения истории заказов:', error);
    res.status(500).json({ message: 'Не удалось загрузить историю заказов' });
  }
});


// ЮKASSA: Создание платежа для заказа
app.post('/api/payment/create', async (req, res) => {
  try {
    const { userId, totalPrice } = req.body;

    // Создаем запись заказа в нашей базе данных Docker PostgreSQL
    const order = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        totalPrice: parseFloat(totalPrice),
        status: 'pending'
      }
    });

    // Формируем уникальный ключ идемпотентности для предотвращения дублей платежей
    const idempotenceKey = uuidv4();

    // Запрос к API ЮKassa на генерацию платежной сессии
    const payment = await checkout.createPayment({
      amount: {
        value: totalPrice.toFixed(2),
        currency: 'RUB'
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: 'http://localhost:3000/profile'
      },
      description: `Оплата заказа №${order.id} в TechStore`,
      metadata: {
        order_id: order.id.toString()
      },
      capture: true
    }, idempotenceKey);

    // Возвращаем фронтенду ссылку на оплату
    res.json({
      paymentUrl: payment.confirmation.confirmation_url,
      orderId: order.id
    });

  } catch (error: any) {
    console.error('Ошибка создания платежа в ЮKassa:', error);
    res.status(500).json({ message: 'Не удалось сформировать счет на оплату' });
  }
});

// ЮKASSA: Вебхук об успешной оплате (Вызывается сервером ЮKassa)
app.post('/api/webhooks/yandex-kassa', async (req, res) => {
  try {
    const { event, object } = req.body;

    if (event === 'payment.succeeded') {
      const orderId = parseInt(object.metadata.order_id);
      const yandexInvoiceId = object.id;

      // Обновляем статус заказа в PostgreSQL через Призму
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          yandexInvoiceId: yandexInvoiceId
        }
      });

      console.log(`[ЮKassa] Заказ ${orderId} успешно оплачен. Транзакция: ${yandexInvoiceId}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка обработки вебхука ЮKassa:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 1С: Синхронизация остатков из 1С:Управление торговлей
app.post('/api/1c/sync-stock', async (req, res) => {
  const { oneCId, price, stock, name, category } = req.body;
  
  await prisma.product.upsert({
    where: { oneCId },
    update: { price, stock, name },
    create: { oneCId, name, price, stock, category }
  });

  res.json({ success: true, message: "Данные из 1С синхронизированы" });
});

// СДЭК: Расчет доставки (Упрощенный mock-пример вызова API СДЭК)
app.post('/api/shipping/cdek-calculate', async (req, res) => {
  const { cityTo, weight } = req.body;
  const mockPrice = weight * 150 + 300; 
  res.json({ price: mockPrice, deliveryDays: '2-4' });
});

// ==========================================
// 2. GRAPHQL API: Управляемый поиск по каталогу
// ==========================================
const typeDefs = gql`
  type Review {
    id: ID!
    userName: String!
    rating: Int!
    comment: String!
    createdAt: String!
  }
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String
    reviews: [Review]
    ratingAvg: Float
     image: String
  }
 type Query {
  searchProducts(query: String, sellerId: Int!): [Product]
}

`;


const resolvers = {
  Query: {
    searchProducts: async (_: any, { query, category, sellerId }: { query: string, category?: string, sellerId?: number }) => {
      // 1. Получаем продукты вместе с отзывами и фильтруем по продавцу, если он передан
      const products = await prisma.product.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          category: category ? category : undefined,
          // Если sellerId передан (из профиля продавца) — фильтруем по нему,
          // если не передан (для витрины покупателя) — выводим все товары
          sellerId: sellerId ? sellerId : undefined
        },
        include: { reviews: true },
        orderBy: { id: 'desc' } // Свежие товары будут отображаться выше
      });

      // 2. Считаем средний рейтинг для каждого товара "на лету"
      return products.map(product => {
        const reviewsCount = product.reviews.length;
        
        // Если отзывов нет, ставим рейтинг 0, иначе считаем среднее
        const avg = reviewsCount > 0 
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount 
          : 0;

        return {
          ...product,
          ratingAvg: parseFloat(avg.toFixed(1)) // Округляем до 1 знака после запятой (например, 4.7)
        };
      });
    }
  }
};




// Запуск совмещенного сервера
async function startServer() {
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app: app as any, path: '/graphql' });

  app.listen(4000, () => {
    console.log('🚀 Бэкенд запущен:');
    console.log('👉 REST API & Webhooks: http://localhost:4000/api');
    console.log('👉 GraphQL Поиск: http://localhost:4000/graphql');
  });
}

startServer();
