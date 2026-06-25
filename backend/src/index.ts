// backend/src/index.ts
import 'dotenv/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { prisma } from './db';
import { typeDefs, resolvers } from './graphql';
import { verifyToken } from './utils/jwt';

// Импорт роутов
import paymentRoutes from './routes/payment';
import deliveryRoutes from './routes/delivery';
import webhookRoutes from './routes/webhook';
import { generalLimiter, strictLimiter } from './middleware/rateLimit';


if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  console.log('✅ Sentry инициализирован (бэкенд)');
} else {
  console.warn('⚠️ SENTRY_DSN не задан, Sentry отключён');
}

console.log('🔄 Загрузка сервера...');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
app.use('/api', generalLimiter);
app.use('/api/payment', strictLimiter);
app.use('/api/auth', strictLimiter);

// REST-роуты
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
    Sentry.captureException(error); // отправляем ошибку в Sentry
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();