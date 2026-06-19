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
// КАТАЛОГ: Безопасная выдача товаров без 500
// ==========================================
app.get('/api/products', async (
  req: Request, 
  res: Response
) => {
  const { subcategoryId } = req.query;

  try {
    // Если id пустой, отдаем все позиции
    const noId = !subcategoryId || 
      subcategoryId === 'null' || 
      subcategoryId === 'undefined';

    if (noId) {
      const all = await prisma.product.findMany({
        where: { status: 'APPROVED' }
      });
      return res.json(all);
    }

    // Если id передан, фильтруем по СУБД
    const filtered = await prisma.product.findMany({
      where: {
        subcategoryId: subcategoryId as string,
        status: 'APPROVED'
      }
    });
    res.json(filtered);
  } catch (error) {
    console.error('Catalog Error:', error);
    res.status(500).json({ error: 'DB Error' });
  }
});
// ==========================================
// ИСПРАВЛЕНО: Безопасный поиск PostgreSQL
// ==========================================
app.get('/api/products/search', async (
  req: Request, 
  res: Response
) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);

  try {
    const clean = query.replace(/[^\w\sа-яА-ЯёЁ]/g, '');
    const formatted = clean.trim().split(/\s+/).join(' & ');

    const results = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Product" 
      WHERE to_tsvector('russian', "title" || ' ' || "description") 
      @@ to_tsquery('russian', $1)
      AND "status" = 'APPROVED'
    `, formatted);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Search Error' });
  }
});

// ПРОДАВЕЦ: Добавление карточки без конфликта Json
app.post('/api/products/create', async (
  req: Request, 
  res: Response
) => {
  const { 
    title, description, price, imageUrl, 
    stock, subcategoryId, specs 
  } = req.body;

  try {
    const jsonSpecs = specs ? (specs as any) : {};

    const newProduct = await prisma.product.create({
      data: {
        title,
        description: description || 'Нет описания',
        price: parseFloat(price),
        imageUrl: imageUrl || 'https://unsplash.com',
        stock: parseInt(stock),
        subcategoryId,
        specs: jsonSpecs,
        status: 'PENDING'
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Create Error' });
  }
});

// КАТАЛОГ: Получение категорий для сайдбара
app.get('/api/categories', async (
  req: Request, 
  res: Response
) => {
  try {
    const data = await prisma.category.findMany({
      include: { subcategories: true }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Categories Error' });
  }
});

// ПОДКЛЮЧЕНИЕ СЕРВЕРА К ПОРТУ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
});
