// backend/src/index.ts
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

// Импорт роутов
import paymentRoutes from './routes/payment';
import deliveryRoutes from './routes/delivery';
import webhookRoutes from './routes/webhook';

console.log('🔄 Загрузка сервера...');

const app = express();

// ⭐ ГЛАВНОЕ: НАСТРОЙКА CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://diplomprog.vercel.app',
    process.env.FRONTEND_URL 
  ].filter(Boolean), 
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Подключаем REST-роуты
app.use('/api/payment', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/webhook', webhookRoutes);

// Контекст GraphQL
const context = async ({ req, res }: any) => {
  let token = req.cookies.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  let user = null;
  if (token) {
    user = verifyToken(token);
  }
  return { req, res, user, prisma };
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  try {
    console.log('🔄 Инициализация Apollo Server...');
    await server.start();
    app.use('/graphql', expressMiddleware(server, { context }));

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Сервер GraphQL запущен на http://localhost:${PORT}/graphql`);
      console.log(`✅ REST API /api/payment, /api/delivery, /api/webhook доступны`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();