import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. КАТАЛОГ: Получение категорий и подкатегорий
// ==========================================
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subcategories: true }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении категорий каталога' });
  }
});

// ==========================================
// 2. ПРОФИЛЬ: Корзина, расчет итога и доставка
// ==========================================

// Получить корзину пользователя с финансовым итогом
app.get('/api/cart/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    const total = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    res.json({ items: cartItems, financialTotal: total });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении корзины' });
  }
});

// Оформление заказа (с выбором PICKUP, CDEK, BOXBERRY)
app.post('/api/orders', async (req: Request, res: Response) => {
  const { userId, deliveryMethod, items } = req.body; // deliveryMethod: 'PICKUP' | 'CDEK' | 'BOXBERRY'
  try {
    const totalPrice = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    
    const order = await prisma.order.create({
      data: {
        userId,
        deliveryMethod,
        totalPrice,
        status: 'PENDING', // Начальный статус подтверждения товара
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // Очищаем корзину после успешного заказа
    await prisma.cartItem.deleteMany({ where: { userId } });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании заказа' });
  }
});

// История покупок пользователя
app.get('/api/orders/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const history = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка истории покупок' });
  }
});

// ==========================================
// 3. КАБИНЕТ ПРОДАВЦА: Модерация и Склад (Stock)
// ==========================================

// Имитация вебхука / эндпоинта Яндекс-ID авторизации продавца
app.post('/api/auth/yandex-seller', async (req: Request, res: Response) => {
  const { yandexId, email } = req.body;
  try {
    let seller = await prisma.user.findUnique({ where: { yandexId } });
    if (!seller) {
      seller = await prisma.user.create({
        data: { email, yandexId, role: 'SELLER' }
      });
    }
    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка Яндекс-ID авторизации' });
  }
});

// Добавление товара на модерацию (указывается stock)
app.post('/api/products/create', async (req: Request, res: Response) => {
  const { title, description, price, imageUrl, stock, sellerId, subcategoryId } = req.body;
  try {
    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        imageUrl,
        stock: parseInt(stock),
        sellerId,
        subcategoryId,
        status: 'PENDING' // По умолчанию отправляется на модерацию администрации
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка добавления товара на модерацию' });
  }
});

// Товары продавца для отслеживания статусов и наличия
app.get('/api/seller/products/:sellerId', async (req: Request, res: Response) => {
  const { sellerId } = req.params;
  try {
    const products = await prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товаров продавца' });
  }
});

// ==========================================
// 4. АДМИНИСТРАЦИЯ: Заявки, Проверка на экстремизм
// ==========================================

// Список всех заявок на модерацию для админа
app.get('/api/admin/moderation-requests', async (req: Request, res: Response) => {
  try {
    const requests = await prisma.product.findMany({
      where: { status: 'PENDING' },
      include: { subcategory: true, seller: true }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
});

// Выпадающий список экстремистских материалов (фильтр названий книг)
app.get('/api/admin/extremist-blacklist', async (req: Request, res: Response) => {
  try {
    const blacklist = await prisma.extremistBook.findMany();
    res.json(blacklist);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка загрузки стоп-листа' });
  }
});

// Действие администратора: Одобрить (APPROVED) или Отклонить (REJECTED)
app.patch('/api/admin/moderate/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { status } = req.body; // 'APPROVED' | 'REJECTED'
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status }
    });
    res.json({ message: `Статус товара изменен на ${status}`, updatedProduct });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка изменения статуса модерации' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер бэкенда запущен на http://localhost:${PORT}`);
});
