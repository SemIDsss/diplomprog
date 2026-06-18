'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import * as amplitude from '@amplitude/analytics-browser';
import Script from 'next/script';

import { RoleMode, CartItem } from './types';
import { BuyerWorkspace } from './BuyerWorkspace';
import { SellerWorkspace } from './SellerWorkspace';
import { AdminWorkspace } from './AdminWorkspace';

const YM_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YM_COUNTER_ID) || 12345678;

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<RoleMode>('buyer');
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_KEY || 'KEY', { defaultTracking: true });
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
    const localUser = localStorage.getItem('user');

    if (!token || !localUser) {
      router.push('/auth');
      return;
    }

    const parsedUser = JSON.parse(localUser);
    setUser(parsedUser);
    
    const savedRole = localStorage.getItem(`user_role_${parsedUser.id}`) as RoleMode;
    if (savedRole) setActiveRole(savedRole);
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, [router]);

  const handleRoleChange = (role: RoleMode) => {
    setActiveRole(role);
    if (user?.id) localStorage.setItem(`user_role_${user.id}`, role);
  };

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-medium">Загрузка профиля...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      {/* Безопасное подключение Яндекс.Метрики без вызовов insertBefore */}
      <Script 
        id="yandex-metrika" 
        strategy="afterInteractive"
        src="https://yandex.ru"
        onLoad={() => {
          const ym = (window as any).ym || function() { 
            ((window as any).ym.a = (window as any).ym.a || []).push(arguments) 
          };
          (window as any).ym = ym;
          ym(YM_COUNTER_ID, "init", { 
            clickmap: true, 
            trackLinks: true, 
            accurateTrackBounce: true, 
            webvisor: true 
          });
        }}
      />

      {/* ШАПКА КАНАЛА */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">👤</div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Личный кабинет — {user.name || user.email}</h2>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Выйти из аккаунта</button>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            {(['buyer', 'seller', 'admin'] as RoleMode[]).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeRole === role ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {role === 'buyer' && '🛒 Покупатель'}
                {role === 'seller' && '💼 Продавец'}
                {role === 'admin' && '🛡 Админ'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {activeRole === 'buyer' && <BuyerWorkspace cart={cart} setCart={setCart} user={user} />}
        {activeRole === 'seller' && <SellerWorkspace user={user} />}
        {activeRole === 'admin' && <AdminWorkspace />}
      </div>
    </div>
  );
}
