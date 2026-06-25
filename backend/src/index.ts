import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { prisma } from './db';
import helmet from 'helmet';
import { typeDefs, resolvers } from './graphql';
import { verifyToken } from './utils/jwt';

import paymentRoutes from './routes/payment';
import deliveryRoutes from './routes/delivery';
import webhookRoutes from './routes/webhook';

console.log('🔄 Загрузка сервера...');

const app = express();


const allowedOrigins = [
  /^https?:\/\/localhost:\d+$/,                    // локальные порты
  /^https:\/\/.*\.vercel\.app$/,                   // все поддомены Vercel
  /^https:\/\/diplomprog-.*\.onrender\.com$/,      // ваш Render домен (опционально)
];

app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);
    
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// REST-роуты
app.use('/api/payment', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/webhook', webhookRoutes);

// Контекст для Apollo
const context = async ({ req, res }: any) => {
  console.log('🍪 Cookies:', req.cookies);
  let token = req.cookies.token;
  console.log('🔑 Token from cookie:', token);

  // Если токена нет в куках, пробуем из заголовка (для обратной совместимости)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 Token from Authorization header:', token);
    }
  }

  let user = null;
  if (token) {
    user = verifyToken(token);
    console.log('👤 User from token:', user);
  } else {
    console.warn('⚠️ Токен отсутствует');
  }

  return { req, res, user, prisma };
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false, // Временно отключаем для отладки
});

async function startServer() {
  try {
    console.log('🔄 Инициализация Apollo Server...');
    await server.start();

    // 2. GraphQL с отдельной настройкой CORS
    app.use(
      '/graphql',
      expressMiddleware(server, {
        context,
      }),
      // Добавляем промежуточное ПО для принудительной установки CORS-заголовков
      (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
      }
    );

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Сервер GraphQL запущен на http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();