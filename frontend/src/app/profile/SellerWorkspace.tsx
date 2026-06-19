'use client';
import React, { useState } from 'react';

interface ProductItem {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function SellerDashboard() {
  const [isYandexAuth, setIsYandexAuth] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const [myProducts, setMyProducts] = useState<ProductItem[]>([
    { id: '1', title: 'Раритетное издание книги 1902г', price: 25000, stock: 1, status: 'APPROVED' },
    { id: '2', title: 'Детская кухня из дерева Уют', price: 8900, stock: 5, status: 'PENDING' }
  ]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !stock) return;

    const newProd: ProductItem = {
      id: String(Date.now()),
      title,
      price: Number(price),
      stock: Number(stock),
      status: 'PENDING'
    };

    setMyProducts([newProd, ...myProducts]);
    setTitle(''); setPrice(''); setStock('');
    alert('Товар отправлен администрации на модерацию!');
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 text-gray-800 text-sm">
      <h1 className="text-xl font-black border-b pb-2">Кабинет продавца</h1>

      {!isYandexAuth ? (
        <div className="bg-white border rounded-xl p-5 text-center shadow-sm space-y-3">
          <p className="text-gray-500 font-medium">Для работы необходимо пройти авторизацию:</p>
          <button
            onClick={() => setIsYandexAuth(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition"
          >
            Войти через Яндекс ID
          </button>
        </div>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg flex justify-between items-center text-xs">
            <span>✓ Авторизация по протоколу Yandex Passport успешна</span>
            <button onClick={() => setIsYandexAuth(false)} className="underline font-bold text-green-700">Выйти</button>
          </div>

          <form onSubmit={handleCreateProduct} className="bg-white p-5 border rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-gray-700">➕ Создание новой карточки товара</h2>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Название товара</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded-lg text-xs" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Цена (₽)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2 rounded-lg text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Наличие на складе</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full border p-2 rounded-lg text-xs" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 text-xs transition">
              Отправить на модерацию
            </button>
          </form>

          <div className="bg-white p-5 border rounded-xl shadow-sm space-y-3">
            <h2 className="font-bold text-gray-700">📊 Мониторинг остатков и статусов</h2>
            <div className="divide-y divide-gray-100">
              {myProducts.map(prod => (
                <div key={prod.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">{prod.title}</h3>
                    <p className="text-xs text-gray-400">В наличии: {prod.stock} шт. | Цена: {prod.price} ₽</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                    prod.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {prod.status === 'APPROVED' ? 'Одобрен' : 'Модерация'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

