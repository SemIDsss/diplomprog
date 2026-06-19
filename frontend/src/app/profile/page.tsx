'use client';
import React, { useState } from 'react';
import SellerDashboard, { Product } from '../seller/page';
import AdminDashboard from '../admin/page';

export default function ProfileRouter() {
  const [role, setRole] = useState<'USER' | 'SELLER' | 'ADMIN'>('USER');
  const [db, setDb] = useState<Product[]>([
    {
      id: 'demo-1',
      title: 'Детская кухня из дерева Уют',
      category: 'Мебель',
      price: 8900,
      stock: 5,
      imageUrl: 'https://unsplash.com',
      status: 'PENDING',
      specs: { 'Материал': 'Дерево' }
    }
  ]);

  const handleAdd = (p: Product) => setDb([p, ...db]);

  const handleMod = (id: string, st: 'APPROVED' | 'REJECTED', r?: string) => {
    setDb(db.map(p => p.id === id ? { ...p, status: st, rejectReason: r } : p));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 text-xs text-gray-800">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          <p className="font-bold text-blue-900 uppercase text-xxs">Тестирование ролей</p>
        </div>
        <div className="flex bg-white border p-1 rounded-lg gap-1">
          {['USER', 'SELLER', 'ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => setRole(r as any)}
              className={`px-3 py-1 rounded font-bold text-xxs ${
                role === r ? 'bg-blue-600 text-white' : 'text-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {role === 'SELLER' && <SellerDashboard list={db} onAdd={handleAdd} />}
      {role === 'ADMIN' && <AdminDashboard list={db} onMod={handleMod} />}
      {role === 'USER' && (
        <div className="bg-white p-6 border rounded-xl text-center text-gray-400">
          Интерфейс корзины покупателя активен.
        </div>
      )}
    </div>
  );
}
