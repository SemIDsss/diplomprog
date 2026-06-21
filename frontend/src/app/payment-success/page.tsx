'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const id = searchParams.get('orderId');
    if (id) {
      setOrderId(id);
      // ✅ СОБЫТИЕ: успешная оплата
      sendMetricaEvent('payment_success', { orderId: id });
      trackEvent('payment_success', { 
        orderId: id,
        userId: localStorage.getItem('userId')
      });
    }

    localStorage.removeItem('cart');

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/buyer');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Оплата прошла успешно!</h1>
        {orderId && (
          <p className="text-sm text-gray-500 mb-2">Заказ #{orderId.substring(0, 8)}</p>
        )}
        <p className="text-gray-600 mb-4">Ваш заказ принят и передан в обработку.</p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-green-700">📧 Письмо с подтверждением отправлено на ваш email</p>
        </div>
        <p className="text-sm text-gray-400">Перенаправление в профиль через {countdown} сек...</p>
        <button
          onClick={() => router.push('/buyer')}
          className="mt-4 bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition"
        >
          Вернуться в профиль
        </button>
      </div>
    </div>
  );
}