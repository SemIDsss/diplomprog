import { DeliveryMethod } from './src/generated/prisma/index.js';

interface ShippingCalculated {
  price: number;
  days: number;
  carrier: string;
}

export class ShippingService {
  /**
   * Расчет параметров доставки по методу из ТЗ
   */
  public static calculateShipping(method: DeliveryMethod, orderTotal: number): ShippingCalculated {
    switch (method) {
      case 'CDEK':
        return {
          price: orderTotal > 5000 ? 0 : 350, // Бесплатно от 5000 рублей
          days: 3,
          carrier: 'СДЭК Логистика'
        };
      case 'BOXBERRY':
        return {
          price: orderTotal > 6000 ? 0 : 400,
          days: 4,
          carrier: 'Boxberry Доставка'
        };
      case 'PICKUP':
      default:
        return {
          price: 0,
          days: 0,
          carrier: 'Самовывоз из пункта выдачи'
        };
    }
  }
}
