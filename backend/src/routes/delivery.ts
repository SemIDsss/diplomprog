import express from 'express';
import { DeliveryService } from '../delivery';
import { authenticate } from '../middleware/auth';

const router = express.Router();

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
    res.status(500).json({ error: 'Failed to calculate delivery' });
  }
});

export default router; 