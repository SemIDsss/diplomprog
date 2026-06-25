// src/delivery.ts
export interface DeliveryParams {
  city: string;
  weight: number;
  dimensions?: { length: number; width: number; height: number };
  service: 'cdek' | 'boxberry';
}

export interface DeliveryResponse {
  service: string;
  price: number;
  days: number;
  currency: string;
  city: string;
}

export class DeliveryService {
  static async calculateDelivery(params: DeliveryParams): Promise<DeliveryResponse> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const basePrice = 200;
    const weightCoeff = params.weight * 50;
    const cityCoeff = params.city.length % 3 === 0 ? 100 : 0;
    let price = basePrice + weightCoeff + cityCoeff;
    let days = 3;
    if (params.service === 'boxberry') {
      price *= 1.1;
      days = 4;
    }
    return {
      service: params.service,
      price: Math.round(price),
      days,
      currency: 'RUB',
      city: params.city,
    };
  }

  static async createDeliveryOrder(params: DeliveryParams & { orderId: string }): Promise<{ trackingNumber: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { trackingNumber: `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}` };
  }
}