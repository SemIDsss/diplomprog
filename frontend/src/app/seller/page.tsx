'use client';
import React, { useState } from 'react';
import { Product } from '../profile/page';

interface SellerProps {
  list?: Product[];
  onAdd?: (p: Product) => void;
}

export default function SellerDashboard({ list = [], onAdd }: SellerProps) {
  const [auth, setAuth] = useState(false);
  
  // Базовые поля
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<'Книги' | 'Мебель' | 'Игрушки'>('Книги');
  const [sub, setSub] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  
  // Поля логистики
  const [weight, setWeight] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [l, setL] = useState('');
  
  // Характеристика
  const [spec1, setSpec1] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !stock) return;

    const specs: { [key: string]: string } = {};
    if (cat === 'Книги') specs['Автор'] = spec1 || 'Не указан';
    else if (cat === 'Мебель') specs['Материал'] = spec1 || 'Не указан';
    else specs['Возраст'] = spec1 || '0+';

    const item: Product = {
      id: `p-${Date.now()}`,
      title,
      category: cat,
      subcategory: sub || 'Общая',
      price: Number(price),
      stock: Number(stock),
      weight: Number(weight) || 0.5,
      width: Number(w) || 10,
      height: Number(h) || 10,
      length: Number(l) || 10,
      imageUrl: 'https://unsplash.com',
      status: 'PENDING',
      specs
    };

    if (onAdd) onAdd(item);
    
    // Сброс полей формы
    setTitle(''); setSub(''); setPrice(''); setStock('');
    setWeight(''); setW(''); setH(''); setL(''); setSpec1('');
    alert('Товар отправлен администрации на модерацию!');
  };

  return (
    <div className="space-y-4 text-xs">
      {!auth ? (
        <div className="bg-white border p-4 rounded-xl text-center shadow-sm">
          <button onClick={() => setAuth(true)} className="bg-red-600 text-white font-bold py-1.5 px-4 rounded-lg">
            Войти через Яндекс ID
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="bg-white p-4 border rounded-xl space-y-3 shadow-sm">
            <h2 className="font-bold text-gray-700 text-sm">➕ Создание новой карточки товара</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Название товара" className="border p-2 rounded-lg" required />
              <select value={cat} onChange={e => setCat(e.target.value as any)} className="border p-2 rounded-lg bg-white">
                <option value="Книги">📚 Книги</option>
                <option value="Мебель">🪑 Мебель</option>
                <option value="Игрушки">🧸 Игрушки</option>
              </select>
              <input type="text" value={sub} onChange={e => setSub(e.target.value)} placeholder="Подкатегория" className="border p-2 rounded-lg" />
            </div>

            {/* Блок логистических параметров (для СДЭК/Boxberry) */}
            <div className="bg-gray-50 p-3 rounded-lg border grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Вес (кг)" className="border p-1.5 rounded bg-white" required />
              <input type="number" value={w} onChange={e => setW(e.target.value)} placeholder="Ширина (см)" className="border p-1.5 rounded bg-white" required />
              <input type="number" value={h} onChange={e => setH(e.target.value)} placeholder="Высота (см)" className="border p-1.5 rounded bg-white" required />
              <input type="number" value={l} onChange={e => setL(e.target.value)} placeholder="Длина (см)" className="border p-1.5 rounded bg-white" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена (₽)" className="border p-2 rounded-lg" required />
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Остаток склада" className="border p-2 rounded-lg" required />
              <input type="text" value={spec1} onChange={e => setSpec1(e.target.value)} placeholder="Спецификация (Автор/Материал)" className="border p-2 rounded-lg" />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">
              Отправить спецификацию на модерацию
            </button>
          </form>

          {/* Таблица мониторинга ресурсов */}
          <div className="bg-white p-4 border rounded-xl shadow-sm space-y-2">
            <h2 className="font-bold text-gray-700">📊 Мониторинг ресурсов склада и статусов</h2>
            <div className="divide-y divide-gray-100">
              {list.map(p => (
                <div key={p.id} className="py-2.5 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-bold text-gray-900">{p.title}</p>
                    <p className="text-xxs text-gray-400">
                      Склад: <span className="font-bold text-gray-700">{p.stock} шт.</span> | Логистика: {p.weight}кг ({p.width}х{p.height}х{p.length}см)
                    </p>
                    {p.rejectReason && (
                      <p className="text-red-600 font-bold bg-red-50 p-1 rounded border mt-1">
                        Причина отказа: {p.rejectReason}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                    p.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.status === 'APPROVED' ? 'Одобрен' : p.status === 'PENDING' ? 'Модерация' : 'Отклонен'}
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

