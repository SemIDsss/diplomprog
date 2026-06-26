import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { PrismaClient } from '@prisma/client';
import { typeDefs, resolvers } from './graphql';
import { authMiddleware, graphqlContext } from './middleware/auth';
import { PaymentService } from './payment';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

(async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // ---------- CORS (с белым списком) ----------
  const allowedOrigins = process.env.CLIENT_URL
    ? [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001']
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  // ---------- Cookie Parser (обязательно!) ----------
  app.use(cookieParser());

  // ---------- Webhook ЮKassa (ДО express.json()) ----------
  app.post(
    '/webhook/yookassa',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      try {
        const event = req.body;
        console.log('📥 Webhook от ЮKassa:', event);
        if (event.object?.status === 'succeeded') {
          const paymentId = event.object.id;
          const prisma = req.app.get('prisma') as PrismaClient;
          const updated = await prisma.order.updateMany({
            where: { paymentId },
            data: { status: 'APPROVED' },
          });
          if (updated.count > 0) console.log(`✅ Заказ с paymentId ${paymentId} обновлён`);
        }
        res.sendStatus(200);
      } catch (error) {
        console.error('❌ Ошибка webhook:', error);
        res.sendStatus(500);
      }
    }
  );

  app.use(express.json());
  app.use(authMiddleware);

  // ---------- REST: статус платежа ----------
  app.get('/payment/order/:orderId/status', async (req, res) => {
    try {
      const { orderId } = req.params;
      const prisma = req.app.get('prisma') as PrismaClient;

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.status(404).json({ error: 'Заказ не найден' });

      if (order.status === 'APPROVED') {
        return res.json({ status: 'succeeded', orderId });
      }

      if (order.paymentId) {
        try {
          const paymentStatus = await PaymentService.getPaymentStatus(order.paymentId);
          if (paymentStatus.status === 'succeeded') {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: 'APPROVED' },
            });
            return res.json({ status: 'succeeded', orderId });
          }
          return res.json({ status: 'pending', orderId });
        } catch (err) {
          console.error('Ошибка запроса к ЮKassa:', err);
          const mappedStatus = order.status === 'APPROVED' ? 'succeeded' : 'pending';
          return res.json({ status: mappedStatus, orderId });
        }
      }

      const mappedStatus = order.status === 'APPROVED' ? 'succeeded' : 'pending';
      res.json({ status: mappedStatus, orderId });
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
      res.status(500).json({ error: 'Внутренняя ошибка' });
    }
  });

  // ---------- GraphQL ----------
  const prismaClient = new PrismaClient();
  app.set('prisma', prismaClient);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true,
    csrfPrevention: false, // ← ОТКЛЮЧАЕМ CSRF-ЗАЩИТУ (для локальной разработки)
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => graphqlContext({ req, res }),
    })
  );

  app.get('/health', (req, res) => res.send('OK'));

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
    console.log(`🔗 GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`🔗 Статус платежа: http://localhost:${PORT}/payment/order/:id/status`);
    console.log(`🔗 Webhook: http://localhost:${PORT}/webhook/yookassa`);
  });
})();