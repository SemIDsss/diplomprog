import express from 'express';
import crypto from 'crypto';
import { prisma } from '../db';

const router = express.Router();
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';

router.post('/yookassa', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;

    if (!SECRET_KEY) {
      console.warn('⚠️ YOOKASSA_SECRET_KEY не задан, вебхук не защищён');
      
    } else if (!signature) {
      console.warn('⚠️ Вебхук без подписи');
      return res.status(403).send('Missing signature');
    } else {
      const expectedSignature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('base64');
      if (signature !== expectedSignature) {
        console.warn('❌ Неверная подпись вебхука');
        return res.status(403).send('Invalid signature');
      }
    }

    const event = req.body;
    console.log('📨 Webhook received:', event);

    if (event.object?.status === 'succeeded') {
      const orderId = event.object.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status !== 'APPROVED') {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'APPROVED' },
          });
          console.log(`✅ Заказ ${orderId} оплачен (вебхук)`);
        } else {
          console.log(`ℹ️ Заказ ${orderId} уже оплачен или не существует`);
        }
      } else {
        console.warn('⚠️ Нет orderId в metadata вебхука');
      }
    } else {
      console.log(`ℹ️ Получено событие: ${event.object?.status || 'unknown'}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;