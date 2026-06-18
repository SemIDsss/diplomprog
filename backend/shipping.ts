import express, { Request, Response } from 'express';
import axios from 'axios';
import { prisma } from './server';

export const shippingRouter = express.Router();

const CDEK_AUTH_URL =
  'https://cdek.ru';
const CDEK_CALC_URL =
  'https://cdek.ru';

const CDEK_CLIENT_ID =
  process.env.CDEK_CLIENT_ID || 'EMscd6u9vTZbwYKF0uY5Z6';
const CDEK_CLIENT_SECRET =
  process.env.CDEK_CLIENT_SECRET || 'b9v6pZUPR74Lp9swp';

export async function calculateShippingInternal(
  city: string,
  provider: string,
  items: any[]
): Promise<number> {
  let totalWeight = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let totalHeight = 0;

  for (const item of items) {
    const dbProduct = await prisma.product.findUnique({
      where: { id: parseInt(item.id, 10) }
    });
    if (dbProduct) {
      const qty = item.quantity || 1;
      // Исправлено логическое падение: защита от 0
      totalWeight += (dbProduct.weightGrams || 400) * qty;
      totalHeight += (dbProduct.heightMm || 50) * qty;
      maxLength = Math.max(
        maxLength,
        dbProduct.lengthMm || 150
      );
      maxWidth = Math.max(
        maxWidth,
        dbProduct.widthMm || 150
      );
    }
  }

  const safeCity = String(city)
    .trim()
    .substring(0, 50)
    .toLowerCase();

  // Заглушка расчета стоимости доставки для диплома
  const volumeWeight =
    (maxLength * maxWidth * totalHeight) / 5000;
  const billingWeight = Math.max(
    totalWeight / 1000,
    volumeWeight
  );
  return Math.ceil(280 + billingWeight * 90);
}

shippingRouter.post(
  '/calculate',
  async (req: Request, res: Response) => {
    try {
      const { city, provider, items } = req.body;
      if (!city || !provider || !items) {
        return res
          .status(400)
          .json({ error: 'Параметры неполные' });
      }
      const price = await calculateShippingInternal(
        city,
        provider,
        items
      );
      return res.json({ price, provider });
    } catch {
      return res
        .status(500)
        .json({ error: 'Ошибка калькулятора' });
    }
  }
);
