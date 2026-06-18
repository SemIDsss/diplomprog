'use client';

import Link from 'next/link';

// Обратите внимание на ОБЯЗАТЕЛЬНЫЙ "export default" и заглавную букву в имени функции Components
export default function HomePage() {
  return (
    <div className="w-full min-h-[calc(100vh-70px)] bg-slate-50 flex flex-col items-center justify-center font-sans px-4 py-12">
      
      {/* ГЛАВНЫЙ БЛОК: ПРИВЕТСТВИЕ И СТАТИСТИКА */}
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 shadow-xl shadow-slate-100/50 text-center space-y-8 transition-all hover:shadow-2xl">
        
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 text-3xl mb-2 shadow-inner animate-bounce">
            👋
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-800">
            Добро пожаловать в <span className="text-blue-600">TechMarket</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-400 max-w-xl mx-auto">
            Современный маркетплейс электроники и гаджетов. Покупайте проверенную технику или зарабатывайте на продаже своих лотов.
          </p>
        </div>

        {/* БЛОК КНОПОК ДЕЙСТВИЯ (ИНТЕРФЕЙС УПРАВЛЕНИЯ) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
          
          {/* Кнопка 1: Перейти в магазин */}
          <Link 
            href="/catalog" 
            className="flex flex-col items-center justify-center p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] group"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🛍️</span>
            <span className="font-extrabold text-sm uppercase tracking-wider">Открыть каталог</span>
            <span className="text-[11px] opacity-70 font-medium mt-1">Искать гаджеты</span>
          </Link>

          {/* Кнопка 2: Личный кабинет */}
          <Link 
            href="/profile" 
            className="flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] group"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">👤</span>
            <span className="font-extrabold text-sm uppercase tracking-wider">Личный кабинет</span>
            <span className="text-[11px] opacity-70 font-medium mt-1">Кабинет селлера и админа</span>
          </Link>

        </div>

        {/* БЛОК ПРЕИМУЩЕСТВ ПЛАТФОРМЫ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100 text-left">
          
          <div className="flex items-start gap-3">
            <span className="text-xl bg-slate-50 p-2 rounded-xl border border-slate-100">🛡️</span>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Модерация лотов</h4>
              <p className="text-xs text-slate-400 mt-0.5">Администрация строго проверяет все товары перед публикацией.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl bg-slate-50 p-2 rounded-xl border border-slate-100">🛒</span>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Удобная корзина</h4>
              <p className="text-xs text-slate-400 mt-0.5">Добавляйте товары в один клик и настраивайте службы доставки.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl bg-slate-50 p-2 rounded-xl border border-slate-100">💼</span>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Личный кабинет</h4>
              <p className="text-xs text-slate-400 mt-0.5">Быстро переключайтесь между ролями покупателя, продавца и админа.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
