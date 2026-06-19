'use client';
import React, { useState } from 'react';

interface RequestItem {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  stock: number;
  imageUrl: string;
}

export default function AdminDashboard() {
  const blacklist = ['Манифест Экстремизма', 'Терроризм и хаос', 'Запрещенная книга 1'];
  const [selectedFilter, setSelectedFilter] = useState('');
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 'r-1',
      title: 'Манифест Экстремизма',
      description: 'Подозрительная литература.',
      price: 15000,
      seller: 'Продавец ID 09',
      stock: 1,
      imageUrl: 'https://unsplash.com'
    },
    {
      id: 'r-2',
      title: 'Манга Наруто Том 5',
      description: 'Комикс в хорошем состоянии.',
      price: 600,
      seller: 'Продавец ID 12',
      stock: 45,
      imageUrl: 'https://unsplash.com'
    }
  ]);

  const handleAction = (id: string, text: string) => {
    setRequests(requests.filter(r => r.id !== id));
    alert(text);
  };

  const filtered = requests.filter(r => {
    if (selectedFilter === '') return true;
    return r.title === selectedFilter;
  });

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 text-gray-800 text-sm">
      <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex justify-between items-center">
        <div>
          <h1 className="font-black text-red-700 text-base">Панель Администратора</h1>
          <p className="text-xxs text-red-500 font-medium">Доступ разрешен только аккаунту разработчика</p>
        </div>
        <span className="bg-red-600 text-white font-mono text-xxs px-2 py-0.5 rounded font-bold">ROOT</span>
      </div>

      <section className="bg-white p-4 border rounded-xl shadow-sm space-y-2">
        <h2 className="font-bold text-gray-700">🔍 Выпадающий фильтр проверки на экстремизм</h2>
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="w-full border p-2 rounded-lg text-xs bg-gray-50 font-medium"
        >
          <option value="">Показывать все заявки</option>
          {blacklist.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>
        {selectedFilter !== '' && (
          <div className="bg-red-100 text-red-700 p-2 rounded-lg text-xxs font-bold">
            ⚠️ Выбранное название входит в федеральный список экстремистских материалов!
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-bold text-gray-700">📥 Поступающие заявки модерации</h2>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center bg-white p-4 border rounded-xl">Новых заявок нет</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const isExtremist = blacklist.includes(req.title);
              return (
                <div key={req.id} className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm ${isExtremist ? 'border-red-400 bg-red-50/20' : 'border-gray-200'}`}>
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border shrink-0 mx-auto">
                    <img src={req.imageUrl} alt={req.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">{req.title}</h3>
                        <span className="font-black text-blue-600">{req.price} ₽</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                      <p className="text-xxs text-gray-400">От: {req.seller} | На складе: {req.stock} шт.</p>
                    </div>
                    <div className="flex gap-2 text-xxs font-bold">
                      <button onClick={() => handleAction(req.id, 'Одобрено!')} className="flex-1 bg-green-600 text-white py-1.5 rounded-md hover:bg-green-700 transition">
                        Одобрить товар
                      </button>
                      <button onClick={() => handleAction(req.id, 'Заблокировано!')} className="flex-1 bg-red-600 text-white py-1.5 rounded-md hover:bg-red-700 transition">
                        {isExtremist ? '🛑 Блок (Экстремизм)' : 'Отклонить'}
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
