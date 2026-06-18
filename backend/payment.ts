import { prisma } from './db';

export class PaymentService {
  /**
   * Симуляция создания платежа во внешней системе
   */
  public static async createPaymentSession(orderId: string, amount: number) {
    console.log(`[PAYMENT] Создание транзакции для заказа ${orderId} на сумму ${amount} руб.`);
    
    // В реальном дипломном проекте здесь будет fetch('https://yookassa.ru')
    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 11)}`;
    const mockConfirmationUrl = `https://test-payment-gateway.ru{mockPaymentId}`;

    return {
      paymentId: mockPaymentId,
      confirmationUrl: mockConfirmationUrl,
      status: 'pending'
    };
  }

  /**
   * Подтверждение успешной оплаты (Имитация вебхука банка)
   */
  public static async confirmOrderPayment(orderId: string) {
    try {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' } // Переводим статус из PENDING (Ожидает) в PROCESSING (В сборке)
      });
      console.log(`[PAYMENT] Заказ ${orderId} успешно оплачен и передан на сборку.`);
      return updatedOrder;
    } catch (error) {
      console.error(`[PAYMENT] Ошибка при подтверждении оплаты заказа ${orderId}:`, error);
      throw error;
    }
  }
}
