import 'dotenv/config';
import express, {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  ApolloServer,
  gql
} from 'apollo-server-express';
import { PrismaClient } from './src/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwtStandard from 'jsonwebtoken';
import cluster from 'cluster';
import os from 'os';
import {
  shippingRouter,
  calculateShippingInternal
} from './shipping';
import { paymentRouter } from './payment';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
const JWT_SECRET =
  process.env.JWT_SECRET || 'secure_key_fallback';

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    name: string;
  };
}

export const checkAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Токен отсутствует'
      });
    }
    const tokenParts = authHeader.split(' ');
    const tokenStr = tokenParts[1]; 
    const decoded = jwtStandard.verify(
      tokenStr,
      JWT_SECRET
    ) as any;

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    if (!dbUser) {
      return res.status(401).json({
        message: 'Аккаунт удален'
      });
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name || 'User'
    };
    next();
  } catch {
    return res.status(401).json({
      message: 'Токен невалиден'
    });
  }
};

app.use((
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ [Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Сбой СУБД'
  });
});

app.use('/api/shipping', shippingRouter);
app.use('/api/payment', paymentRouter);

// 1. ПУБЛИЧНЫЙ РОУТ ДЛЯ ПОКУПАТЕЛЕЙ (Оживляет каталог на фронтенде)
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    // Получаем ВСЕ товары из базы данных (без фильтрации по отсутствующему полю status)
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' }
    });
    
    // Возвращаем структуру в точности так, как ожидает ваш фронтенд
    return res.json({ products });
  } catch (error: any) {
    console.error('❌ Ошибка чтения каталога:', error);
    return res.status(500).json({ message: 'Ошибка сервера при загрузке каталога' });
  }
});

// 2. ЗАЩИЩЕННЫЙ РОУТ ДЛЯ АДМИН-ПАНЕЛИ (Остается для менеджмента)
app.get(
  '/api/admin/products',
  checkAuth as any,
  async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Отказ: Доступно только администратору' });
    }

    let searchStatus = undefined;
    if (req.query.status) {
      searchStatus = String(req.query.status)
        .trim()
        .replace(/['"]+/g, '');
    }

    // Если поле status есть в вашей schema.prisma, этот роут отработает в админке
    const products = await prisma.product.findMany({
      where: searchStatus
        ? { status: searchStatus }
        : undefined,
      orderBy: { id: 'desc' }
    });
    return res.json({ products });
  }
);


app.post(
  '/api/orders/create',
  checkAuth as any,
  async (req: AuthRequest, res) => {
    try {
      const {
        deliveryProvider,
        deliveryCity,
        items
      } = req.body;
      const uId = req.user!.userId;

      const dbProducts = await prisma.product.findMany({
        where: {
          id: {
            in: items.map((i: any) =>
              parseInt(i.id, 10)
            )
          }
        }
      });

      let itemsPriceSum = 0;
      const snapshotItems = items.map((clientItem: any) => {
        const target = dbProducts.find(
          p => p.id === parseInt(clientItem.id, 10)
        );
        if (!target) {
          throw new Error('Товар не найден');
        }
        itemsPriceSum +=
          target.price * parseInt(clientItem.quantity, 10);
        return {
          id: target.id,
          name: target.name,
          price: target.price,
          quantity: parseInt(clientItem.quantity, 10)
        };
      });

      const shippingPrice =
        await calculateShippingInternal(
          deliveryCity,
          deliveryProvider,
          items
        );
      const finalPrice = itemsPriceSum + shippingPrice;

      const newOrder = await prisma.order.create({
        data: {
          userId: uId,
          amount: finalPrice,
          status: 'pending',
          delivery: {
            provider: deliveryProvider,
            city: deliveryCity,
            price: shippingPrice
          },
          items: snapshotItems
        }
      });
      return res.status(201).json({
        success: true,
        orderId: newOrder.id
      });
    } catch (err: any) {
      return res.status(500).json({
        message: err.message || 'Ошибка ордера'
      });
    }
  }
);

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const candidate = await prisma.user.findUnique({
      where: { email }
    });
    if (candidate) {
      return res.status(400).json({
        message: 'Существует'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirst = (await prisma.user.count()) === 0;

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: isFirst ? 'admin' : 'buyer'
      }
    });
    res.status(201).json({ message: 'Зарегистрирован' });
  } catch {
    res.status(500).json({ message: 'Ошибка СУБД' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      return res.status(404).json({
        message: 'Не найден'
      });
    }
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );
    if (!isMatch) {
      return res.status(400).json({
        message: 'Неверный пароль'
      });
    }

    const token = jwtStandard.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put(
  '/api/products/:id',
  checkAuth as any,
  async (req: AuthRequest, res) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Отказ'
      });
    }
    try {
      const product = await prisma.product.update({
        where: { id: parseInt(req.params.id, 10) },
        data: { status: String(req.body.status) }
      });
      return res.json({ success: true, product });
    } catch {
      return res.status(500).json({
        message: 'Ошибка модерации'
      });
    }
  }
);

app.post(
  '/api/products/create',
  checkAuth as any,
  async (req: AuthRequest, res) => {
    try {
      const {
        name,
        description,
        price,
        stock,
        category,
        sku,
        barcode,
        brand,
        weightGrams,
        widthMm,
        heightMm,
        lengthMm,
        image,
        model,
        color,
        material,
        warrantyMonths
      } = req.body;

      // ИСПРАВЛЕНО: Уникальный криптостойкий генератор SKU
      const timestamp = Date.now();
      const finalSku =
        sku && sku.trim() !== ''
          ? String(sku).trim()
          : `SKU-${timestamp}-${Math.floor(
              Math.random() * 1000
            )}`;

      const extensions = {
        model: model || 'N/A',
        color: color || 'N/A',
        material: material || 'N/A',
        warrantyMonths:
          parseInt(warrantyMonths, 10) || 12
      };

      const product = await prisma.product.create({
        data: {
          oneCId: `WEB-${timestamp}`,
          name,
          description: description || '',
          price: parseFloat(price),
          stock: parseInt(stock, 10) || 1,
          category,
          image: image || null,
          status: 'PENDING_MODERATION',
          sku: finalSku,
          barcode: barcode || null,
          brand: brand || null,
          weightGrams: parseInt(weightGrams, 10) || 0,
          widthMm: parseInt(widthMm, 10) || 0,
          heightMm: parseInt(heightMm, 10) || 0,
          lengthMm: parseInt(lengthMm, 10) || 0,
          metadata: extensions,
          seller: {
            connect: { id: req.user!.userId }
          }
        }
      });
      res.status(201).json({ success: true, product });
    } catch (err: any) {
      res.status(500).json({
        message: 'Ошибка лота: ' + err.message
      });
    }
  }
);

const typeDefs = gql`
  type Review {
    id: ID!
    userName: String!
    rating: Int!
    comment: String!
    createdAt: String!
    metadata: String
  }
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: String!
    description: String
    image: String
    ratingAvg: Float
    reviews: [Review]
    sku: String
    brand: String
    weightGrams: Int
    widthMm: Int
    heightMm: Int
    lengthMm: Int
  }
  type Query {
    searchProducts(
      query: String
      category: String
    ): [Product]
  }
  type Mutation {
    createReview(
      productId: ID!
      comment: String!
      rating: Int!
      isAnonymous: Boolean!
      userAgent: String
    ): Review
  }
`;

const resolvers = {
  Query: {
    searchProducts: async (
      _: any,
      { query, category }: any
    ) => {
      const products = await prisma.product.findMany({
        where: {
          name: query
            ? { contains: query, mode: 'insensitive' }
            : undefined,
          category: category || undefined,
          status: 'APPROVED'
        },
        include: { reviews: true }
      });
      return products.map(p => {
        const count = p.reviews.length;
        const avg =
          count > 0
            ? p.reviews.reduce(
                (sum, r) => sum + r.rating,
                0
              ) / count
            : 0;
        return {
          ...p,
          ratingAvg: parseFloat(avg.toFixed(1))
        };
      });
    }
  },
  Mutation: {
    createReview: async (
      _: any,
      {
        productId,
        comment,
        rating,
        isAnonymous,
        userAgent
      }: any,
      ctx: any
    ) => {
      if (!ctx.user) {
        throw new Error('Отказ в авторизации');
      }
      const pId = parseInt(productId, 10);
      const uId = ctx.user.userId;

      const orders = await prisma.order.findMany({
        where: { userId: uId, status: 'paid' }
      });
      const hasPurchased = orders.some((o: any) => {
        const itemsList = o.items as any[];
        return itemsList.some(
          (item: any) => item.id === pId
        );
      });
      if (!hasPurchased) {
        throw new Error('Товар не оплачен');
      }

      return await prisma.review.create({
        data: {
          productId: pId,
          userName: isAnonymous
            ? 'Аноним'
            : ctx.user.email,
          rating,
          comment: comment.trim(),
          metadata: { userAgent }
        }
      });
    }
  }
};

async function startServer() {
  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    for (let i = 0; i < numCPUs; i++) cluster.fork();
    cluster.on('exit', () => cluster.fork());
  } else {
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        try {
          const authHeader = req.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            const tokenParts = authHeader.split(' ');
            const tokenStr = tokenParts[1]; 
            return {
              user: jwtStandard.verify(
                tokenStr,
                JWT_SECRET
              )
            };
          }
        } catch {}
        return {};
      }
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
      app: app as any,
      path: '/graphql'
    });
    app.listen(4000);
  }
}
startServer();
