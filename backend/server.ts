import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ==========================================
// ИСПРАВЛЕНО: Полнотекстовый поиск PostgreSQL (TSQUERY)
// ==========================================
app.get('/api/products/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  
  if (!query) {
    return res.json([]);
  }

  try {
    // Используем нативный queryRaw для морфологического поиска Postgres
    const formattedQuery = query.trim().split(/\s+/).join(' & ');
    
    const results = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Product" 
      WHERE to_tsvector('russian', "title" || ' ' || "description") 
      @@ to_tsquery('russian', $1)
      AND "status" = 'APPROVED'
    `, formattedQuery);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'PostgreSQL Fulltext Search Error' });
  }
});

// КАТАЛОГ: Получение структуры категорий
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const data = await prisma.category.findMany({
      include: { subcategories: true }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'DB Error' });
  }
});
// ==========================================
// ИСПРАВЛЕНО: Создание карточки без конфликта Json
// ==========================================
app.post('/api/products/create', async (req: Request, res: Response) => {
  const { 
    title, description, price, imageUrl, 
    stock, sellerId, subcategoryId, specs,
    weight, width, height, length, category 
  } = req.body;

  try {
    // Явно приводим объект спецификаций к Prisma JSON типу
    const jsonSpecs = specs ? (specs as any) : {};

    const newProduct = await prisma.product.create({
      data: {
        title,
        description: description || 'Описание отсутствует',
        price: parseFloat(price),
        imageUrl: imageUrl || 'https://unsplash.com',
        stock: parseInt(stock),
        subcategoryId,
        specs: jsonSpecs,
        // Дополнительные логистические поля, переданные в бэкенд
        status: 'PENDING' // Отправка на склад модерации
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Ошибка записи в СУБД:', error);
    res.status(500).json({ error: 'Ошибка сохранения карточки товара' });
  }
});

// КАТАЛОГ: Получение товаров подкатегории
app.get('/api/products', async (req: Request, res: Response) => {
  const { subcategoryId } = req.query;
  try {
    const products = await prisma.product.findMany({
      where: {
        subcategoryId: subcategoryId as string,
        status: 'APPROVED'
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка выборки товаров' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер бэкенда запущен на http://localhost:${PORT}`);
});
