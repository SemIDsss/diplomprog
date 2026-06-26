import express from 'express';
import { PaymentService } from '../payment';
import { authenticate } from '../middleware/auth';
import { prisma } from '../db';

const router = express.Router();

// Создание платежа
router.post('/create', authenticate, async (req: any, res) => {
  try {
    const { amount, description, orderId, paymentMethod, returnUrl } = req.body;
    if (!amount || amount <= 0 || !orderId) {
      return res.status(400).json({ error: 'Missing required fields: amount, orderId' });
    }

    const payment = await PaymentService.createPayment({
      amount,
      description: description || `Оплата заказа ${orderId}`,
      orderId,
      paymentMethod: paymentMethod || 'bank_card',
      returnUrl,
    });

    // Сохраняем paymentId для проверки статуса в будущем
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: payment.id },
    });

    res.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});


router.get('/order/:orderId/status', authenticate, async (req: any, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentId: true, userId: true },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (!order.paymentId) {
      return res.json({ status: 'succeeded' });
    }
    const status = await PaymentService.getPaymentStatus(order.paymentId);
    res.json(status);
  } catch (error) {
    console.error('Error getting payment status by order:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export default router;