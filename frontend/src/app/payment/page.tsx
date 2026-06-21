'use client';



import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const method = searchParams.get('method') || 'YUKASSA';

    if (!orderId || !amount) {
      setError('Недостаточно данных для оплаты');
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        const response = await fetch('http://localhost:5000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: `
              query GetOrder($userId: String!) {
                orders(userId: $userId) {
                  id
                  totalAmount
                  status
                  deliveryMethod
                  deliveryPrice
                  items {
                    id
                    quantity
                    price
                    product {
                      title
                    }
                  }
                }
              }
            `,
            variables: { userId }
          })
        });

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const orders = result.data.orders || [];
        const order = orders.find((o: any) => o.id === orderId);
        
        if (!order) {
          throw new Error('Заказ не найден');
        }

        setOrderData(order);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams]);

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const orderId = searchParams.get('orderId');

      const response = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation ApproveOrder($orderId: String!) {
              approveOrder(orderId: $orderId) {
                id
                status
              }
            }
          `,
          variables: { orderId }
        })
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      alert('✅ Оплата прошла успешно!');
      router.push('/payment-success?orderId=' + orderId);
    } catch (err: any) {
      alert('❌ Ошибка оплаты: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 text-sm">Загрузка данных заказа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/buyer')}
            className="mt-6 bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700"
          >
            Вернуться в профиль
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-mobile">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 border shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">💳 Оплата заказа</h1>
              <p className="text-gray-500 text-sm mt-1">Заполните данные для оплаты</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Заказ #{orderData.id.substring(0, 8)}</p>
                <p className="font-bold text-gray-900 text-lg">
                  {orderData.totalAmount} ₽
                </p>
                <p className="text-xs text-gray-400">
                  Доставка: {orderData.deliveryMethod} · {orderData.deliveryPrice} ₽
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Товары в заказе:</h3>
                <div className="space-y-2">
                  {orderData.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product.title} × {item.quantity}
                      </span>
                      <span className="font-bold text-gray-800">
                        {item.price * item.quantity} ₽
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Способ оплаты</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="YUKASSA"
                      defaultChecked
                      className="w-4 h-4 text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      💳 Банковская карта (ЮKassa)
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="SBP"
                      className="w-4 h-4 text-blue-600"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      📱 СБП (Система быстрых платежей)
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition active:scale-95"
              >
                Оплатить {orderData.totalAmount} ₽
              </button>

              <p className="text-center text-xs text-gray-400">
                🔒 Тестовый режим. Реальные деньги не списываются.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}