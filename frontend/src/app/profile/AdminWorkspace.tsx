'use client';
import React, { useState } from 'react';

export default function AdminDashboard() {
  // Список экстремистских названий книг для фильтра (синхронизируется с БД)
  const extremistDatabase = ['Манифест Экстремизма', 'Терроризм и хаос', 'Запрещенная книга 1'];

  // Заявки от продавцов на добавление в каталог
  const [requests, setRequests] = useState([
    {
      id: 'req-1',
      title: 'Манифест Экстремизма',
      description: 'Подозрительная старая литература с призывами.',
      price: 15000,
      seller: 'Иванов И.И. (ID: seller_09)',
      stock: 1,
      imageUrl: 'https://unsplash.com' // Тестовое большое фото
    },
    {
      id: 'req-2',
      title: 'Манга Наруто Том 5',
      description: 'Оригинальный комикс в идеальном состоянии.',
      price: 600,
      seller: 'Петров А.В. (ID: seller_12)',
      stock: 45,
      imageUrl: 'https://unsplash.com'
    }
  ]);

  // Выбранный фильтр в выпадающей строке
  const [selectedFilter, setSelectedFilter] = useState('');

  const handleApprove = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
    alert('Товар успешно добавлен в общий каталог!');
  };

  const handleReject = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
    alert('Товар отклонен и заблокирован.');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-gray-800 min-h-screen">
      <div className="border-b pb-4 flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-200">
        <div>
          <h1 className="text-3xl font-black text-red-700">👑 Панель Супер-Администратора</h1>
          <p className="text-sm text-red-600 font-medium">Доступ разрешен только для подтвержденного аккаунта разработчика</p>
        </div>
        <span className="bg-red-600 text-white font-mono px-3 py-1 rounded text-xs font-bold">ROOT PRIVILEGES</span>
      </div>

      {/* Окно фильтрации экстремизма */}
      <section className="bg-white p-6 border rounded-xl shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-700">🔍 Быстрая проверка названий на Экстремизм (Федеральный список)</h2>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-500">Выберите название книги для сверки триггеров:</label>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full border p-2.5 rounded-lg bg-gray-50 font-medium"
          >
            <option value="">-- Все книги --</option>
            {extremistDatabase.map((book, index) => (
              <option key={index} value={book}>{book}</option>
            ))}
          </select>
        </div>
        {selectedFilter && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg font-bold animate-pulse">
            ⚠️ Внимание! Книга "{selectedFilter}" находится под запретом законодательства. Карточки с таким заголовком подлежат немедленному отклонению!
          </div>
        )}
      </section>

      {/* Окно с заявками от продавцов */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-700">📥 Заявки модерации на добавление в каталог</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500 bg-white p-6 rounded-xl border text-center">Новых заявок пока нет</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests
              .filter(req => selectedFilter === '' || req.title === selectedFilter)
              .map((req) => {
                const isExtremist = extremistDatabase.includes(req.title);
                return (
                  <div key={req.id} className={`bg-white border-2 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 transition ${isExtremist ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`}>
                    
                    {/* Большая читаемая картинка товара */}
                    <div className="w-full md:w-64 h-64 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border">
                      <img src={req.imageUrl} alt={req.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Полная информация о товаре */}
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-2xl font-bold text-gray-900">{req.title}</h3>
                          <span className="text-xl font-black text-blue-600">{req.price} ₽</span>
                        </div>
                        <p className="text-gray-600 mt-2 text-base leading-relaxed">{req.description}</p>
                        
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                          <p>👤 <strong>Продавец:</strong> {req.seller}</p>
                          <p>📦 <strong>Количество (Склад):</strong> {req.stock} шт.</p>
                        </div>
                      </div>

                      {/* Инструменты администратора */}
                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition shadow-sm"
                        >
                          Одобрить и опубликовать
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition shadow-sm"
                        >
                          {isExtremist ? '🛑 Заблокировать (Экстремизм)' : 'Отклонить заявку'}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
