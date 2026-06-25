// src/routes/delivery.ts
import express from 'express';
import { DeliveryService } from '../delivery';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Расчёт стоимости доставки
router.post('/calculate', authenticate, async (req: any, res) => {
  try {
    const { city, weight, dimensions, service } = req.body;
    if (!city || !weight || !service) {
      return res.status(400).json({ error: 'Missing required fields: city, weight, service' });
    }
    const result = await DeliveryService.calculateDelivery({
      city,
      weight,
      dimensions,
      service,
    });
    res.json(result);
  } catch (error) {
    console.error('Delivery calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate delivery' });
  }
});

// Создание заказа на доставку
router.post('/order', authenticate, async (req: any, res) => {
  try {
    const { city, weight, service, orderId } = req.body;
    if (!city || !weight || !service || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await DeliveryService.createDeliveryOrder({
      city,
      weight,
      service,
      orderId,
    });
    res.json(result);
  } catch (error) {
    console.error('Delivery order creation error:', error);
    res.status(500).json({ error: 'Failed to create delivery order' });
  }
});

export default router;