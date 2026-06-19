'use client';
import React, { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  quantity: number;
  product: { title: string; price: number };
}

interface Order {
  id: string;
  createdAt: string;
  totalPrice: number;
  deliveryMethod: string;
  status: string;
}

export default function PersonalProfile() {
  const userId = "test-user-uuid-123";
  const [cart, setCart] = useState({ items: [] as CartItem[], financialTotal: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'CDEK' | 'BOXBERRY'>('PICKUP');
  const [loading, setLoading] = useState(true);

  const getDeliveryPrice = () => {
    if (deliveryMethod === 'CDEK') {
      return cart.financialTotal > 5000 ? 0 : 350;
    }
    if (deliveryMethod === 'BOXBERRY') {
      return cart.financialTotal > 6000 ? 0 : 400;
    }
    return 0;
  };

  useEffect(() => {
    setLoading(true);
    const api = "http://localhost:5000/api";
    
    const fetchCart = fetch(`${api}/cart/${userId}`)
      .then(res => res.ok ? res.json() : { items: [], financialTotal: 0 })
      .catch(() => ({ items: [], financialTotal: 0 }));

    const fetchOrders = fetch(`${api}/orders/history/${userId}`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => []);

    Promise.all([fetchCart, fetchOrders]).then(([cData, oData]) => {
      setCart(cData);
      setOrders(oData);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-gray-500 mt-2 text-sm font-medium">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-gray-800 text-sm">
      <div className="border-b pb-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900">Личный кабинет</h1>
          <p className="text-xs text-gray-500 font-medium">Управление заказами</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-5 border rounded-xl shadow-sm">
            <h2 className="font-bold mb-3 text-gray-900">🛒 Ваша корзина</h2>
            {!cart.items || cart.items.length === 0 ? (
              <p className="text-gray-400 py-3 text-center bg-gray-50 rounded-lg">Корзина пуста</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{item.product?.title}</p>
                      <p className="text-xs text-gray-400">Количество: {item.quantity} шт.</p>
                    </div>
                    <p className="font-black">{item.product ? item.product.price * item.quantity : 0} ₽</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white p-5 border rounded-xl shadow-sm">
            <h2 className="font-bold mb-3 text-gray-900">🚚 Способ доставки</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'PICKUP', label: '🚶 Самовывоз', desc: '0 ₽' },
                { id: 'CDEK', label: '📦 СДЭК (CDEK)', desc: '3 дня (350 ₽)' },
                { id: 'BOXBERRY', label: '📦 Boxberry', desc: '4 дня (400 ₽)' }
              ].map((m) => (
                <label
                  key={m.id}
                  className={`p-3 border rounded-xl cursor-pointer text-center block transition ${
                    deliveryMethod === m.id ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={m.id}
                    checked={deliveryMethod === m.id}
                    onChange={() => setDeliveryMethod(m.id as any)}
                    className="sr-only"
                  />
                  <p className="font-bold text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl text-white space-y-4 shadow-md">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Итог</h2>
          <div className="space-y-1.5 border-b border-slate-800 pb-3 text-xs font-medium text-slate-300">
            <div className="flex justify-between">
              <span>Товары:</span>
              <span>{cart.financialTotal} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>Доставка:</span>
              <span>{getDeliveryPrice()} ₽</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-400">Всего к оплате:</span>
            <span className="text-2xl font-black text-blue-400">{cart.financialTotal + getDeliveryPrice()} ₽</span>
          </div>
          <button 
            onClick={() => alert('Заказ зафиксирован!')}
            disabled={!cart.items || cart.items.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg text-xs disabled:opacity-40"
          >
            Оформить заказ
          </button>
        </div>
      </div>

      <section className="bg-white p-5 border rounded-xl shadow-sm">
        <h2 className="font-bold mb-3 text-gray-900">📋 История и статусы покупок</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-gray-400 py-3 text-center bg-gray-50 rounded-lg">Покупок нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold border-b">
                  <th className="p-3">ID Заказа</th>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Сумма</th>
                  <th className="p-3">Способ</th>
                  <th className="p-3 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono text-xs text-gray-500">{o.id.substring(0, 8)}...</td>
                    <td className="p-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3 font-bold text-gray-900">{o.totalPrice} ₽</td>
                    <td className="p-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xxs">{o.deliveryMethod}</span></td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                        o.status === 'DELIVERED' ? 'bg-green-50 text-green-700' :
                        o.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {o.status === 'PENDING' ? 'Ожидает' : o.status === 'PROCESSING' ? 'В сборке' : 'Доставлен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
