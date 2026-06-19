import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './db';

const app = express();

// Полная настройка CORS для исключения блокировок браузера
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ДОБАВЛЕНО: Роут получения товаров, привязанных к конкретной подкатегории (Манга, Кухня и т.д.)
app.get('/api/products', async (req: Request, res: Response) => {
  const { subcategoryId } = req.query;
  try {
    const products = await prisma.product.findMany({
      where: {
        subcategoryId: subcategoryId as string,
        status: 'APPROVED' // Показываем в каталоге только одобренные админом товары
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при выборке товаров подкатегории' });
  }
});

// КАТАЛОГ: Получение структуры категорий для сайдбара
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

// ПРОФИЛЬ: Получить корзину пользователя
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

// ИСТОРИЯ ПОКУПОК
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

// КАБИНЕТ ПРОДАВЦА: Добавление карточки товара
app.post('/api/products/create', async (req: Request, res: Response) => {
  const { title, description, price, imageUrl, stock, sellerId, subcategoryId } = req.body;
  try {
    const newProduct = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        imageUrl: imageUrl || "https://unsplash.com",
        stock: parseInt(stock),
        sellerId,
        subcategoryId,
        status: 'PENDING'
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка добавления товара' });
  }
});

// АДМИНИСТРАЦИЯ: Заявки модерации
app.get('/api/admin/moderation-requests', async (req: Request, res: Response) => {
  try {
    const requests = await prisma.product.findMany({
      where: { status: 'PENDING' },
      include: { subcategory: true }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
});

app.patch('/api/admin/moderate/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { status } = req.body;
  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status }
    });
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка изменения статуса модерации' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер бэкенда успешно запущен на порту ${PORT}`);
});
