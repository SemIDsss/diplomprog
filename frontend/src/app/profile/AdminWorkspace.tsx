'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  status: string;
}

export function AdminWorkspace() {
  const [pendingProducts, setPendingProducts] = useState<
    Product[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPending = async () => {
    const token = Cookies.get('token');
    if (!token) {
      setError('Токен администратора отсутствует');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:4000/api/products?status=PENDING_MODERATION',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setPendingProducts(data.products || []);
      }
    } catch {
      setError('Ошибка загрузки очереди');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    window.addEventListener('storage_update', loadPending);
    return () =>
      window.removeEventListener(
        'storage_update',
        loadPending
      );
  }, []);

  const handleModerate = async (
    id: number,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const token = Cookies.get('token');
    try {
      const response = await fetch(
        `http://localhost:4000/api/products/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: decision })
        }
      );

      if (response.ok) {
        setPendingProducts(prev =>
          prev.filter(p => p.id !== id)
        );
        window.dispatchEvent(new Event('storage_update'));
      }
    } catch {
      alert('Критический сбой СУБД');
    }
  };

  if (loading) {
    return <div className="text-sm font-bold">Загрузка...</div>;
  }

  return (
    <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border">
      <h3 className="font-black text-slate-900 text-lg mb-4">
        Модерация лотов (Admin)
      </h3>
      {error && (
        <div className="text-sm font-bold text-red-600 mb-3">
          ⚠ {error}
        </div>
      )}
      {pendingProducts.length === 0 ? (
        <p className="text-sm text-slate-400 italic">
          Очередь верификации пуста.
        </p>
      ) : (
        <div className="space-y-3">
          {pendingProducts.map(product => (
            <div
              key={product.id}
              className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {product.category} •{' '}
                  {product.price.toLocaleString()} ₽
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleModerate(product.id, 'APPROVED')
                  }
                  className="bg-green-600 text-white font-bold text-xs px-3 rounded-lg min-h-[44px]"
                >
                  Одобрить
                </button>
                <button
                  onClick={() =>
                    handleModerate(product.id, 'REJECTED')
                  }
                  className="bg-red-600 text-white font-bold text-xs px-3 rounded-lg min-h-[44px]"
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


