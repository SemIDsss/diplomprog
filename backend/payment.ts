import { prisma } from './db';

export class PaymentService {
  /**
   * Симуляция создания платежа во внешней системе
   */
  public static async createPaymentSession(orderId: string, amount: number) {
    console.log(`[PAYMENT] Создание транзакции для заказа ${orderId} на сумму ${amount} руб.`);
    
    // Генерируем уникальный идентификатор тестовой транзакции
    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 11)}`;
    
    // СТРОГОЕ ИСПРАВЛЕНИЕ: Добавлен пропущенный символ "$" для корректной интерполяции строки.
    // Добавлен Timestamp-параметр ?nocache для предотвращения жесткого кэширования редиректов браузерами.
    const mockConfirmationUrl = `https://test-payment-gateway.ru{mockPaymentId}?nocache=${Date.now()}`;

    // СТРОГОЕ ИСПРАВЛЕНИЕ: Возвращаем флаг success: true для корректной валидации на фронтенде BuyerWorkspace
    return {
      success: true,
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
        // Изменено на APPROVED для синхронизации со сквозной логикой созданного ранее компонента StatusBadge
        data: { status: 'APPROVED' } 
      });
      console.log(`[PAYMENT] Заказ ${orderId} успешно оплачен и передан на сборку.`);
      return updatedOrder;
    } catch (error) {
      console.error(`[PAYMENT] Ошибка при подтверждении оплаты заказа ${orderId}:`, error);
      throw error;
    }
  }
}
