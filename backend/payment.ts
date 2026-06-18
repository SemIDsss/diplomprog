// backend/payment.ts
import express, { Request, Response } from 'express';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid'; // Гарантированный импорт генератора UUID
import { PrismaClient } from '@prisma/client'; // Импорт Prisma для проверки остатков (Решение проблемы №3)

export const paymentRouter = express.Router();
import { prisma } from './db'; 
const shopId = process.env.YOOKASSA_SHOP_ID || '';
const secretKey = process.env.YOOKASSA_SECRET_KEY || '';

let checkout: YooCheckout | null = null;

// ИСПРАВЛЕНИЕ ОШИБКИ HTTP 401: Проверяем, что ключи заполнены И не являются строками-заглушками
if (
  shopId && 
  secretKey && 
  shopId !== 'your_shop_id_here' && 
  secretKey !== 'test_secret_key_here'
) {
  checkout = new YooCheckout({ shopId, secretKey });
  console.log('✅ ЮKassa: Успешно инициализирован боевой платежный контур API.');
} else {
  console.warn('⚠️ ЮKassa: Ключи шифрования отсутствуют или содержат заглушки. Активирована безопасная эмуляция транзакций.');
}

paymentRouter.post('/create', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, amount, paymentMethod, delivery, items } = req.body;

    // Базовая валидация входных данных
    if (!userId || !amount) {
      return res.status(400).json({ message: 'Отсутствуют обязательные параметры: userId или amount' });
    }

    console.log(`\n [{ Время: ${new Date().toLocaleTimeString()} }] 💳 [Бэкенд оплаты] Создание платежной сессии. Юзер ID: ${userId}, Сумма: ${amount} ₽`);

    // --- РЕШЕНИЕ ПРОБЛЕМЫ №3: ВАЛИДАЦИЯ ОСТАТКОВ ТОВАРОВ В КОРЗИНЕ (МАРКЕТПЛЕЙС-ЛОГИКА) ---
    // Проверяем наличие массива товаров в запросе
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        // Ищем каждый покупаемый товар в базе данных через Prisma
        const product = await prisma.product.findUnique({
          where: { id: Number(item.productId) }
        });

        if (!product) {
          return res.status(404).json({ 
            success: false, 
            message: `Товар с ID ${item.productId} не найден в каталоге маркетплейса` 
          });
        }

        // Проверяем критический остаток на складе
        if (product.stock <= 0) {
          console.warn(`🛑 [Блокировка оплаты] Попытка купить дефицитный товар: "${product.name}" (Остаток: ${product.stock})`);
          return res.status(400).json({
            success: false,
            message: `Ошибка оформления заказа: Товар "${product.name}" закончился на складе продавца и недоступен для покупки.`
          });
        }

        // Проверяем, хватает ли товара, если покупатель берет больше одной штуки
        if (product.stock < Number(item.quantity || 1)) {
          return res.status(400).json({
            success: false,
            message: `Недостаточно товара "${product.name}" на складе. Доступно: ${product.stock} шт., запрошено: ${item.quantity} шт.`
          });
        }
      }
      console.log('📦 [Валидация склада] Все позиции проверены, остатки на складе подтверждены.');
    }

    // --- РЕЖИМ РАЗРАБОТКИ / ЭМУЛЯЦИЯ (Если ключи отсутствуют или в .env прописаны фейки) ---
    if (!checkout) {
      // Безопасная генерация ID тестового платежа без рисков упасть по ReferenceError
      const mockPaymentId = `mock-pay-${uuidv4().substring(0, 8)}`;
      // Официальная тестовая страница песочницы ЮMoney для демонстрации
      const fallbackConfirmationUrl = 'https://yoomoney.ru';
      
      console.log(`✅ [Эмуляция ЮKassa] Тестовая ссылка сформирована: ${mockPaymentId}`);
      return res.json({
        success: true,
        paymentId: mockPaymentId,
        confirmationUrl: fallbackConfirmationUrl,
        note: 'Работает демонстрационный режим эмуляции без запросов к внешнему API'
      });
    }

    // --- БОЕВОЙ КОНТУР (Срабатывает только при наличии настоящих рабочих ключей мерчанта) ---
    const idempotenceKey = uuidv4();
    const payment = await checkout.createPayment({
      amount: {
        value: Number(amount).toFixed(2),
        currency: 'RUB'
      },
      capture: true,
      description: `Оплата заказа маркетплейса TechMarket`,
      confirmation: {
        type: 'redirect',
        return_url: 'http://localhost:3000/profile'
      },
      metadata: {
        userId: String(userId)
      }
    }, idempotenceKey);

    console.log(`✅ [ЮKassa API] Реальная сессия создана успешно. ID: ${payment.id}`);
    return res.json({
      success: true,
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url
    });

  } catch (error: any) {
    // Детальное логирование в терминал сервера для упрощения отладки перед защитой
    console.error('❌ Критическая ошибка внутри payment.ts:', error.response?.data || error.message || error);
    return res.status(500).json({ 
      message: 'Внутренняя ошибка платежного шлюза бэкенда',
      error: error.message || 'Unknown handler failure'
    });
  }
});
