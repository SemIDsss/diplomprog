'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const mock = searchParams.get('mock') === 'true';

    if (!orderId) {
      setStatus('error');
      setMessage('❌ Не найден идентификатор заказа');
      return;
    }

    if (mock) {
      setStatus('success');
      setMessage('✅ Тестовый платёж (эмуляция) успешно завершён!');
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;
    const delay = 2000;

    const checkPaymentStatus = async () => {
      attempts++;
      try {
        // ✅ Запрос к новому роуту /api/payment/order/:orderId/status
        const res = await fetch(`${API_BASE}/payment/order/${orderId}/status`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Ошибка получения статуса: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        console.log('📊 Статус платежа:', data);

        if (data.status === 'succeeded') {
          setStatus('success');
          setMessage('✅ Оплата прошла успешно! Заказ оплачен.');
          localStorage.removeItem('cart');
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        } else if (data.status === 'pending') {
          if (attempts < maxAttempts) {
            setStatus('pending');
            setMessage(`⏳ Ожидание подтверждения оплаты (попытка ${attempts}/${maxAttempts})...`);
            setTimeout(checkPaymentStatus, delay);
            return;
          } else {
            setStatus('error');
            setMessage('❌ Превышено время ожидания. Проверьте статус заказа в личном кабинете.');
            return;
          }
        } else {
          setStatus('error');
          setMessage(`❌ Оплата не подтверждена. Статус: ${data.status || 'неизвестен'}`);
        }
      } catch (error: any) {
        console.error('Ошибка проверки статуса:', error);
        setStatus('error');
        setMessage(`❌ Ошибка при проверке статуса платежа: ${error.message}`);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-2xl font-bold mt-4">Проверка оплаты...</h1>
            <p className="text-gray-500">Пожалуйста, подождите</p>
          </>
        )}
        {status === 'pending' && (
          <>
            <Clock size={64} className="text-yellow-500 mx-auto animate-pulse" />
            <h1 className="text-2xl font-bold mt-4 text-yellow-600">Ожидание подтверждения</h1>
            <p className="text-gray-600 mt-2">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={64} className="text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold mt-4 text-green-600">Оплата успешна!</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <button
              onClick={() => router.push('/buyer')}
              className="mt-6 bg-[#ff8012] text-white font-bold py-2 px-6 rounded-xl hover:bg-[#e06a00] transition"
            >
              Вернуться в профиль
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={64} className="text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold mt-4 text-red-600">Ошибка оплаты</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <button
              onClick={() => router.push('/buyer')}
              className="mt-6 bg-gray-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-gray-700 transition"
            >
              Вернуться в профиль
            </button>
          </>
        )}
      </div>
    </div>
  );
}