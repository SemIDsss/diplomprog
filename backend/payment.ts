import express, { Request, Response } from 'express';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid';

export const paymentRouter = express.Router();

// Инициализируем SDK ЮKassa данными из .env сервера
const checkout = new YooCheckout({
  shopId: process.env.YOOKASSA_SHOP_ID || '',
  secretKey: process.env.YOOKASSA_SECRET_KEY || ''
});

// Главный REST-эндпоинт для создания платежа (ЮKassa / СБП одной кнопкой)
paymentRouter.post('/api/payments/create', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, amount, paymentMethod, delivery, items } = req.body;

    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Отсутствуют обязательные параметры платежа' });
    }

    // Уникальный ключ идемпотентности, чтобы избежать двойных списаний при сбоях сети
    const idempotenceKey = uuidv4();

    // Базовые параметры платежа ЮKassa
    const paymentPayload: any = {
      amount: {
        value: Number(amount).toFixed(2),
        currency: 'RUB'
      },
      capture: true, // Автоматическое подтверждение платежа (без двухстадийной оплаты)
      description: `Оплата заказа пользователя ID ${userId} на TechStore`,
      metadata: {
        userId: userId,
        deliveryProvider: delivery?.provider || 'not_specified',
        deliveryCity: delivery?.city || 'not_specified',
        deliveryPrice: delivery?.price || 0
      }
    };

    // НАСТРОЙКА ТИПА ОПЛАТЫ
    if (paymentMethod === 'sbp') {
      // Для СБП передаем специальный код метода оплаты в ЮKassa
      paymentPayload.payment_method_data = {
        type: 'sbp'
      };
      // Страница, куда вернется пользователь после сканирования QR-кода СБП
      paymentPayload.confirmation = {
        type: 'redirect',
        return_url: 'http://localhost:3000/profile' // Ссылка на личный кабинет фронтенда
      };
    } else {
      // Для стандартной ЮKassa (банковские карты, электронные кошельки)
      paymentPayload.confirmation = {
        type: 'redirect',
        return_url: 'http://localhost:3000/profile'
      };
    }

    console.log(`💳 [Создание платежа] Метод: ${paymentMethod.toUpperCase()}, Сумма: ${amount} ₽, User ID: ${userId}`);

    // Отправка запроса в API ЮKassa
    const payment = await checkout.createPayment(paymentPayload, idempotenceKey);

    // Извлекаем ссылку для перенаправления пользователя (платежная форма или фрейм СБП)
    const confirmationUrl = payment.confirmation?.confirmation_url;

    if (!confirmationUrl) {
      console.error('❌ Ошибка ЮKassa: Не получен confirmation_url', payment);
      return res.status(500).json({ message: 'Ошибка шлюза: платежная ссылка не сгенерирована' });
    }

    // Возвращаем фронтенду ссылку для редиректа
    return res.json({
      success: true,
      paymentId: payment.id,
      confirmationUrl: confirmationUrl
    });

  } catch (error: any) {
    console.error('❌ Критическая ошибка при создании платежа ЮKassa:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Внутренняя ошибка платежного сервера' });
  }
});
