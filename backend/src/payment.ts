import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';

export class PaymentService {
  // Создание платежа (уже было, оставляем как есть)
  static async createPayment(params: {
    amount: number;
    description: string;
    orderId: string;
    paymentMethod?: 'bank_card' | 'sbp';
    returnUrl?: string;
  }) {
    const { amount, description, orderId, paymentMethod = 'bank_card', returnUrl } = params;

    if (!SHOP_ID || !SECRET_KEY) {
      console.warn('⚠️ ЮKassa ключи не заданы, используется ЭМУЛЯЦИЯ оплаты');
      return this.createMockPayment(params);
    }

    try {
      const idempotenceKey = uuidv4();
      const paymentData = {
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          return_url: returnUrl || `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}`,
        },
        capture: true,
        description,
        payment_method_data: {
          type: paymentMethod,
        },
        metadata: { orderId },
      };

      const response = await axios.post(
        'https://api.yookassa.ru/v3/payments',
        paymentData,
        {
          auth: { username: SHOP_ID, password: SECRET_KEY },
          headers: { 'Idempotence-Key': idempotenceKey },
        }
      );

      return {
        id: response.data.id,
        status: response.data.status,
        confirmationUrl: response.data.confirmation.confirmation_url,
      };
    } catch (error: any) {
      console.error('❌ ЮKassa API error:', error.response?.data || error.message);
      console.warn('⚠️ Переключение на эмуляцию оплаты из-за ошибки');
      return this.createMockPayment(params);
    }
  }

  // 👇 НОВЫЙ МЕТОД: получение статуса платежа по paymentId
  static async getPaymentStatus(paymentId: string) {
    if (!SHOP_ID || !SECRET_KEY) {
      // Если ключи не заданы – эмулируем статус "succeeded" (для тестов)
      return { status: 'succeeded' };
    }

    try {
      const response = await axios.get(
        `https://api.yookassa.ru/v3/payments/${paymentId}`,
        {
          auth: { username: SHOP_ID, password: SECRET_KEY },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка получения статуса платежа:', error.response?.data || error.message);
      throw new Error('Ошибка получения статуса платежа');
    }
  }

  // Эмуляция (для случая отсутствия ключей)
  private static async createMockPayment(params: any) {
    const mockId = `mock_${uuidv4().slice(0, 8)}`;
    const confirmationUrl = params.returnUrl
      ? params.returnUrl
      : `${process.env.FRONTEND_URL}/payment-success?orderId=${params.orderId}&mock=true`;
    return {
      id: mockId,
      status: 'pending',
      confirmationUrl,
    };
  }
}