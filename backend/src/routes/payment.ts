import express from 'express';
import { PaymentService } from '../payment';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/create', authenticate, async (req: any, res) => {
  try {
    const { amount, description, orderId, paymentMethod, returnUrl } = req.body;
    if (!amount || amount <= 0 || !orderId) {
      return res.status(400).json({ error: 'Missing required fields: amount, orderId' });
    }

    const payment = await PaymentService.createPayment({
      amount,
      description: description || `Оплата заказа ${orderId}`,
      metadata: { orderId, paymentMethod, returnUrl },
    });
    res.json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

router.get('/status/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const status = await PaymentService.getPaymentStatus(paymentId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

router.post('/confirm/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await PaymentService.confirmPayment(paymentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

export default router; 