'use client';

import React, { useState } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  subcategory?: string;
  status?: string;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  imageUrl?: string;
  rejectReason?: string;
  specs?: Record<string, string>;
}

interface SellerProps {
  list?: Product[];
  onAdd?: (p: Product) => void;
}

export default function SellerDashboard({ list = [], onAdd }: SellerProps) {
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<'Книги' | 'Мебель' | 'Игрушки'>('Книги');
  const [sub, setSub] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [weight, setWeight] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [l, setL] = useState('');
  const [spec1, setSpec1] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !stock) {
      alert('Заполните обязательные поля');
      return;
    }

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
      imageUrl: 'https://via.placeholder.com/100',
      status: 'PENDING',
      specs
    };

    if (onAdd) onAdd(item);
    setTitle('');
    setSub('');
    setPrice('');
    setStock('');
    setWeight('');
    setW('');
    setH('');
    setL('');
    setSpec1('');
    alert('✅ Товар отправлен на модерацию!');
  };

  return (
    <div className="space-y-4">
      {/* Форма создания товара */}
      <div className="bg-white p-4 md:p-6 border rounded-2xl shadow-sm">
        <h2 className="font-bold text-gray-800 text-lg mb-4">➕ Создание товара</h2>
        
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название товара *"
              className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              required
            />
            <select
              value={cat}
              onChange={e => setCat(e.target.value as any)}
              className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="Книги">📚 Книги</option>
              <option value="Мебель">🪑 Мебель</option>
              <option value="Игрушки">🧸 Игрушки</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={sub}
              onChange={e => setSub(e.target.value)}
              placeholder="Подкатегория"
              className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Цена (₽) *"
              className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              required
            />
            <input
              type="number"
              value={stock}
              onChange={e => setStock(e.target.value)}
              placeholder="Остаток склада *"
              className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              required
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Параметры логистики</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="Вес (кг)"
                className="w-full border border-gray-200 bg-white px-3 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              />
              <input
                type="number"
                value={w}
                onChange={e => setW(e.target.value)}
                placeholder="Ширина (см)"
                className="w-full border border-gray-200 bg-white px-3 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              />
              <input
                type="number"
                value={h}
                onChange={e => setH(e.target.value)}
                placeholder="Высота (см)"
                className="w-full border border-gray-200 bg-white px-3 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              />
              <input
                type="number"
                value={l}
                onChange={e => setL(e.target.value)}
                placeholder="Длина (см)"
                className="w-full border border-gray-200 bg-white px-3 py-2.5 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              value={spec1}
              onChange={e => setSpec1(e.target.value)}
              placeholder={cat === 'Книги' ? 'Автор' : cat === 'Мебель' ? 'Материал' : 'Возраст'}
              className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-blue-700 transition active:scale-95 min-h-[52px] shadow-sm"
          >
            Отправить на модерацию
          </button>
        </form>
      </div>

      {/* Таблица товаров */}
      <div className="bg-white p-4 md:p-6 border rounded-2xl shadow-sm">
        <h2 className="font-bold text-gray-800 text-lg mb-4">📊 Мои товары</h2>
        
        {list.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">У вас пока нет товаров</p>
        ) : (
          <div className="space-y-3 divide-y divide-gray-100">
            {list.map(p => (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-800 text-sm">{p.title}</p>
                  <p className="text-xs text-gray-400">
                    Склад: <span className="font-bold text-gray-700">{p.stock} шт.</span>
                    {' · '}
                    {p.weight}кг ({p.width}×{p.height}×{p.length}см)
                  </p>
                  {p.rejectReason && (
                    <p className="text-red-600 font-bold text-xs bg-red-50 p-2 rounded-lg border border-red-100 mt-1">
                      Причина отказа: {p.rejectReason}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  p.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {p.status === 'APPROVED' ? '✅ Одобрен' : 
                   p.status === 'PENDING' ? '⏳ Модерация' : '❌ Отклонен'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}