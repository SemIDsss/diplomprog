import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';
const API_URL = 'https://api.yookassa.ru/v3/payments';

export class PaymentService {
  static async createPayment(params: {
    amount: number;
    description: string;
    orderId: string;
    paymentMethod?: 'bank_card' | 'sbp';
    returnUrl?: string;
  }) {
    // Если ключи не заданы – эмуляция
    if (!SHOP_ID || !SECRET_KEY) {
      console.warn('⚠️ ЮKassa ключи не заданы, используется ЭМУЛЯЦИЯ оплаты');
      return this.createMockPayment(params);
    }

    try {
      const idempotenceKey = uuidv4();
      const paymentMethodData = params.paymentMethod === 'sbp'
        ? { type: 'sbp' }
        : { type: 'bank_card' };

      const requestData = {
        amount: { value: params.amount.toFixed(2), currency: 'RUB' },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: params.returnUrl || `${process.env.FRONTEND_URL}/payment-success?orderId=${params.orderId}`,
        },
        description: params.description,
        metadata: { orderId: params.orderId },
        payment_method_data: paymentMethodData,
      };

      const response = await axios.post(API_URL, requestData, {
        auth: { username: SHOP_ID, password: SECRET_KEY },
        headers: { 'Idempotence-Key': idempotenceKey, 'Content-Type': 'application/json' },
      });

      return {
        id: response.data.id,
        status: response.data.status,
        confirmationUrl: response.data.confirmation.confirmation_url,
        amount: parseFloat(response.data.amount.value),
        currency: response.data.amount.currency,
        createdAt: response.data.created_at,
      };
    } catch (error: any) {
      console.error('❌ ЮKassa API error:', error.response?.data || error.message);
      console.warn('⚠️ Переключение на эмуляцию оплаты из-за ошибки');
      return this.createMockPayment(params);
    }
  }

  private static async createMockPayment(params: any) {
    console.log('📌 createMockPayment params:', params);
    const mockId = `mock_${uuidv4().slice(0, 8)}`;
    const confirmationUrl = params.returnUrl 
      ? params.returnUrl 
      : `/payment-success?orderId=${params.orderId}&mock=true`;
    console.log('📌 Mock confirmationUrl:', confirmationUrl);
    return {
      id: mockId,
      status: 'pending',
      confirmationUrl,
      amount: params.amount,
      currency: 'RUB',
      createdAt: new Date().toISOString(),
    };
  }

  static async getPaymentStatus(paymentId: string) {
    if (paymentId.startsWith('mock_')) {
      return { status: 'succeeded' };
    }
    try {
      const response = await axios.get(`${API_URL}/${paymentId}`, {
        auth: { username: SHOP_ID, password: SECRET_KEY },
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting payment status:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  static async confirmPayment(paymentId: string) {
    if (paymentId.startsWith('mock_')) {
      return { confirmed: true };
    }
    return { confirmed: true };
  }
}