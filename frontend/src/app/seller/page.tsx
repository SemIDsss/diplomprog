'use client';
import React, { useState } from 'react';

export interface Product {
  id: string;
  title: string;
  category: 'Книги' | 'Мебель' | 'Игрушки';
  price: number;
  stock: number;
  imageUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  specs: { [key: string]: string };
}

interface SellerProps {
  list?: Product[];
  onAdd?: (p: Product) => void;
}

export default function SellerDashboard({ list = [], onAdd }: SellerProps) {
  const [auth, setAuth] = useState(false);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<'Книги' | 'Мебель' | 'Игрушки'>('Книги');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [spec1, setSpec1] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !stock) return;

    const specs: { [key: string]: string } = {};
    if (cat === 'Книги') specs['Автор'] = spec1 || 'Нет';
    else if (cat === 'Мебель') specs['Материал'] = spec1 || 'Нет';
    else specs['Возраст'] = spec1 || '0+';

    const item: Product = {
      id: `p-${Date.now()}`,
      title,
      category: cat,
      price: Number(price),
      stock: Number(stock),
      imageUrl: 'https://unsplash.com',
      status: 'PENDING',
      specs
    };

    if (onAdd) onAdd(item);
    setTitle(''); setPrice(''); setStock(''); setSpec1('');
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
          <form onSubmit={submit} className="bg-white p-4 border rounded-xl space-y-3">
            <h2 className="font-bold text-gray-700">Новый товар</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Название" className="border p-2 rounded-lg" required />
              <select value={cat} onChange={e => setCat(e.target.value as any)} className="border p-2 rounded-lg bg-white">
                <option value="Книги">Книги</option>
                <option value="Мебель">Мебель</option>
                <option value="Игрушки">Игрушки</option>
              </select>
              <input type="text" value={spec1} onChange={e => setSpec1(e.target.value)} placeholder="Характеристика" className="border p-2 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена" className="border p-2 rounded-lg" required />
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Склад" className="border p-2 rounded-lg" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Опубликовать</button>
          </form>

          <div className="bg-white p-4 border rounded-xl space-y-2">
            <h2 className="font-bold text-gray-700">Ваш склад</h2>
            <div className="divide-y">
              {list.map(p => (
                <div key={p.id} className="py-2 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{p.title}</p>
                    <p className="text-xxs text-gray-400">Склад: {p.stock} | {p.price} ₽</p>
                    {p.rejectReason && <p className="text-red-600 font-bold">Отказ: {p.rejectReason}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded text-xxs font-bold bg-yellow-100 text-yellow-800">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
