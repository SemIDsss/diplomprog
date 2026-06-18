'use client';
import React, { useState } from 'react';

export default function SellerDashboard() {
  const [isYandexAuth, setIsYandexAuth] = useState(false);
  
  // Локальное состояние для добавления новой карточки
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');

  // Список уже добавленных товаров продавца
  const [myProducts, setMyProducts] = useState([
    { id: '1', title: 'Раритетное издание "Преступление и Наказание" 1902г', price: 25000, stock: 1, status: 'APPROVED' },
    { id: '2', title: 'Детская кухня из дерева "Уют"', price: 8900, stock: 5, status: 'PENDING' },
    { id: '3', title: 'Экстремальное пособие анархии (тест)', price: 400, stock: 10, status: 'REJECTED' }
  ]);

  const handleYandexLogin = () => {
    // Симуляция OAuth Яндекс-ID. 
    setIsYandexAuth(true);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !stock) return;

    const newProd = {
      id: String(Date.now()),
      title,
      price: Number(price),
      stock: Number(stock),
      status: 'PENDING' // Все новые карточки отправляются на модерацию администрации
    };

    setMyProducts([newProd, ...myProducts]);
    setTitle(''); setPrice(''); setStock(''); setImage('');
    alert('Товар отправлен на модерацию администрации!');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold border-b pb-4">Кабинет продавца</h1>

      {/* Блок 1: Авторизация Яндекс-ID */}
      {!isYandexAuth ? (
        <div className="bg-white border rounded-xl p-8 text-center shadow-sm space-y-4">
          <p className="text-lg text-gray-600">Для управления продажами и добавления карточек товаров необходимо войти через единую систему:</p>
          <button
            onClick={handleYandexLogin}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-md"
          >
            <span className="bg-white text-red-600 font-black px-1.5 py-0.5 rounded text-sm">Я</span>
            Войти с Яндекс ID (Тест)
          </button>
        </div>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>✓ Вы успешно авторизованы через <strong>Yandex-ID Passport</strong></span>
            <button onClick={() => setIsYandexAuth(false)} className="text-sm underline text-green-700">Выйти</button>
          </div>

          {/* Блок 2: Форма добавления товара */}
          <section className="bg-white p-6 border rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-700">➕ Создание новой карточки товара</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название товара / Книги</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="Например: Манга Наруто Том 3" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Цена (₽)</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2 rounded" placeholder="1500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Количество в наличии на складе</label>
                  <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full border p-2 rounded" placeholder="12" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ссылка на изображение</label>
                <input type="text" value={image} onChange={e => setImage(e.target.value)} className="w-full border p-2 rounded" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition">
                Отправить на модерацию
              </button>
            </form>
          </section>

          {/* Блок 3: Таблица наличия и статусов отправленных товаров */}
          <section className="bg-white p-6 border rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-700">📊 Наличие ваших товаров и статус модерации</h2>
            <div className="divide-y">
              {myProducts.map(prod => (
                <div key={prod.id} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-base">{prod.title}</h3>
                    <p className="text-sm text-gray-500">Цена: {prod.price} ₽ | <span className="font-medium text-gray-700">Наличие на складе: {prod.stock} шт.</span></p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                      prod.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      prod.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {prod.status === 'APPROVED' ? 'Одобрено в каталоге' :
                       prod.status === 'PENDING' ? 'На модерации администрации' : 'Отклонено (Экстремизм/Брак)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
