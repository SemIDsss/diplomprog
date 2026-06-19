'use client';
import React, { useState } from 'react';
import SellerDashboard from '../seller/page';
import AdminDashboard from '../admin/page';
import { Product } from '../seller/page';

interface CartItem {
  product: Product;
  qty: number;
}

export default function ProfilePage() {
  const [role, setRole] = useState<
    'USER' | 'SELLER' | 'ADMIN'
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(
        'diplom_role'
      );
      return (saved as any) || 'USER';
    }
    return 'USER';
  });

  const [delivery, setDelivery] = useState<
    'PICKUP' | 'CDEK' | 'BOXBERRY'
  >('PICKUP');
  const [city, setCity] = useState('Москва');
  const [pay, setPay] = useState<'UKASSA'|'SBP'>(
    'UKASSA'
  );
  const [mapCost, setMapCost] = useState(0);
  const geo: [number, number] = [55.7558, 37.6173];

  const [db, setDb] = useState<Product[]>([
    {
      id: 'p-1', title: 'Манга Наруто Том 1',
      category: 'Книги', subcategory: 'Манга',
      description: 'Твердый переплет.',
      price: 850, stock: 15, weight: 0.3,
      width: 13, height: 18, length: 2,
      imageUrl: 'https://unsplash.com' +
        '/photo-1578632767115-351597cf2477?w=200',
      status: 'APPROVED', specs: {}
    }
  ]);

  const [cart, setCart] = useState<CartItem[]>([
    {
      product: {
        id: 'p-init', title: 'Кухонный стол',
        category: 'Мебель', subcategory: 'Кухня',
        description: 'Массив сосны.',
        price: 12500, stock: 4, weight: 18,
        width: 120, height: 75, length: 80,
        imageUrl: 'https://unsplash.com' +
          '/photo-1577140917170-285929fb55b7?w=200',
        status: 'APPROVED', specs: {}
      },
      qty: 1
    }
  ]);

  const changeQty = (id: string, d: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== id) return item;
      const next = item.qty + d;
      if (next < 0 || next > 9) return item;
      return { ...item, qty: next };
    }).filter(item => item.qty > 0));
  };

  const totalW = cart.reduce(
    (acc, i) => acc + (i.product.weight * i.qty), 0
  );
  
  const getDeliveryCost = () => {
    if (delivery === 'PICKUP') return 0;
    const b = delivery === 'CDEK' ? 250 : 200;
    return Math.round(b + totalW * 90 + mapCost);
  };

  const itemsCost = cart.reduce(
    (acc, i) => acc + (i.product.price * i.qty), 0
  );
  const finalTotal = itemsCost + getDeliveryCost();

  const handleRoleChange = (
    newRole: 'USER' | 'SELLER' | 'ADMIN'
  ) => {
    setRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('diplom_role', newRole);
    }
  };

  const handleModerate = (
    id: string,
    st: 'APPROVED' | 'REJECTED',
    r?: string
  ) => {
    setDb(prev => prev.map(p => 
      p.id === id ? {
        ...p, status: st, rejectReason: r
      } : p
    ));
  };
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 text-xs text-gray-800">
      
      <div className="bg-blue-50 border p-2 rounded-xl flex justify-between items-center">
        <span className="font-bold text-xxs">
          РЕЖИМ:
        </span>
        <div className="flex bg-white border p-1 rounded-lg gap-1">
          {['USER', 'SELLER', 'ADMIN'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r as any)}
              className={`px-2 py-0.5 rounded font-bold text-xxs ${
                role === r 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-gray-600'
              }`}
            >
              {r === 'USER' && '👤 Клиент'}
              {r === 'SELLER' && '🏪 Продавец'}
              {r === 'ADMIN' && '👑 Админ'}
            </button>
          ))}
        </div>
      </div>

      {role === 'SELLER' && (
        <SellerDashboard
          list={db}
          onAdd={p => setDb([p, ...db])}
        />
      )}
      
      {role === 'ADMIN' && (
        <AdminDashboard
          list={db}
          onMod={handleModerate}
        />
      )}

      {role === 'USER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-white p-4 border rounded-xl space-y-2">
              <h2 className="font-black border-b pb-1 text-xs">
                🛒 Корзина товаров
              </h2>
              {cart.length === 0 ? (
                <p className="text-center py-2 text-gray-400">
                  Пусто
                </p>
              ) : (
                <div className="divide-y text-xxs">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="py-2 flex gap-2 items-center"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">
                          {item.product.title}
                        </h3>
                        <p className="text-gray-400">
                          {item.product.price} ₽
                        </p>
                      </div>
                      
                      <div className="flex items-center border rounded bg-gray-50">
                        <button
                          type="button"
                          onClick={() => changeQty(
                            item.product.id, -1
                          )}
                          className="px-1.5 py-0.5 font-bold"
                        >
                          -
                        </button>
                        <span className="px-1 font-mono">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(
                            item.product.id, 1
                          )}
                          className="px-1.5 py-0.5 font-bold"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => changeQty(
                          item.product.id, -10
                        )}
                        className="text-red-500 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="bg-white p-4 border rounded-xl space-y-3">
              <h2 className="font-black border-b pb-1 text-xs">
                🚚 География доставки
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text" value={city}
                  onChange={e => setCity(e.target.value)}
                  className="border p-1.5 rounded-lg"
                  placeholder="Город"
                />
                <select
                  value={delivery}
                  onChange={e => setDelivery(
                    e.target.value as any
                  )}
                  className="border p-1.5 rounded-lg bg-white"
                >
                  <option value="PICKUP">Самовывоз</option>
                  <option value="CDEK">СДЭК (CDEK)</option>
                  <option value="BOXBERRY">Boxberry</option>
                </select>
              </div>
              
              {delivery !== 'PICKUP' && (
                <div className="space-y-1">
                  <p className="text-xxs font-bold text-gray-400">
                    ТОЧКА НА КАРТЕ ПВЗ:
                  </p>
                  <div
                    className="h-32 w-full border rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setMapCost(150)}
                  >
                    <iframe
                      src="https://openstreetmap.org"
                      style={{
                        height: '100%',
                        width: '100%',
                        border: 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-md">
            <h2 className="text-xxs font-bold uppercase text-slate-400">
              Баланс заказа
            </h2>
            <div className="space-y-1 text-xxs text-slate-300 border-b border-slate-800 pb-2">
              <div className="flex justify-between">
                <span>Товары:</span>
                <span>{itemsCost} ₽</span>
              </div>
              <div className="flex justify-between">
                <span>Вес груза:</span>
                <span>{totalW.toFixed(1)} кг</span>
              </div>
              <div className="flex justify-between">
                <span>Доставка:</span>
                <span>{getDeliveryCost()} ₽</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xxs text-slate-400 block">
                СИСТЕМА ОПЛАТЫ:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xxs">
                <button
                  type="button"
                  onClick={() => setPay('UKASSA')}
                  className={`p-1 border rounded-lg ${
                    pay === 'UKASSA' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800'
                  }`}
                >
                  ЮKassa
                </button>
                <button
                  type="button"
                  onClick={() => setPay('SBP')}
                  className={`p-1 border rounded-lg ${
                    pay === 'SBP' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800'
                  }`}
                >
                  СБП (QR)
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-slate-400">Итого:</span>
              <span className="text-lg font-black text-blue-400">
                {finalTotal} ₽
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (pay === 'SBP') {
                  window.location.href = 
                    'https://nspk.ru';
                } else {
                  window.location.href = 
                    'https://yoomoney.ru';
                }
              }}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white font-bold py-1.5 rounded-lg text-xxs disabled:opacity-20 shadow"
            >
              Перейти к внешней оплате ({pay})
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
