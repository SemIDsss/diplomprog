'use client';
import React, { useState } from 'react';

export default function PersonalProfile() {
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'CDEK' | 'BOXBERRY'>('PICKUP');
  
  // Тестовые данные корзины
  const [cartItems, setCartItems] = useState([
    { id: 'p1', title: 'Манга "Атака Титанов" Том 1', price: 750, quantity: 2 },
    { id: 'p2', title: 'Мягкая игрушка Гусь-Обнимусь', price: 1200, quantity: 1 }
  ]);

  // Тестовая история покупок со статусами из БД
  const purchaseHistory = [
    { id: 'o-101', date: '2026-06-15', total: 3400, method: 'CDEK', status: 'Доставлен' },
    { id: 'o-102', date: '2026-06-18', total: 1500, method: 'Самовывоз', status: 'Ожидает подтверждения' }
  ];

  const financialTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold border-b pb-4">Личный кабинет покупателя</h1>

      {/* Блок 1: Корзина товаров */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">🛒 Ваша корзина</h2>
        {cartItems.length === 0 ? (
          <p className="text-gray-500">Корзина пуста</p>
        ) : (
          <div className="divide-y">
            {cartItems.map(item => (
              <div key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-lg">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.price} ₽ × {item.quantity}</p>
                </div>
                <p className="font-semibold">{item.price * item.quantity} ₽</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Блок 2: Выбор доставки */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">🚚 Способ доставки</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'PICKUP', label: '🚶 Самовывоз' },
            { id: 'CDEK', label: '📦 СДЭК (CDEK)' },
            { id: 'BOXBERRY', label: '📦 Boxberry' }
          ].map((method) => (
            <label
              key={method.id}
              className={`p-4 border rounded-xl cursor-pointer text-center font-medium block transition ${
                deliveryMethod === method.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={method.id}
                checked={deliveryMethod === method.id}
                onChange={() => setDeliveryMethod(method.id as any)}
                className="sr-only"
              />
              {method.label}
            </label>
          ))}
        </div>
      </section>

      {/* Блок 3: Финансовый итог */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-lg shadow-md text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium opacity-90">Финансовый итог к оплате</h2>
          <p className="text-sm opacity-75">Выбранный метод: {deliveryMethod}</p>
        </div>
        <p className="text-3xl font-black">{financialTotal} ₽</p>
      </section>

      {/* Блок 4: История покупок */}
      <section className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">📋 История покупок и статусы</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                <th className="p-3 border-b">ID Заказа</th>
                <th className="p-3 border-b">Дата</th>
                <th className="p-3 border-b">Сумма</th>
                <th className="p-3 border-b">Доставка</th>
                <th className="p-3 border-b">Статус подтверждения</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {purchaseHistory.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-gray-700">{order.id}</td>
                  <td className="p-3 text-gray-500">{order.date}</td>
                  <td className="p-3 font-semibold">{order.total} ₽</td>
                  <td className="p-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs">{order.method}</span></td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Доставлен' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
