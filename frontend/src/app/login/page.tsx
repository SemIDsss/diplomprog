'use client';
import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Имитация обычного входа
    setTimeout(() => {
      setLoading(false);
      alert(`Успешный вход под пользователем: ${email}`);
      window.location.href = '/profile';
    }, 1000);
  };

  const handleYandexOAuth = () => {
    setLoading(true);
    // Имитация редиректа на Яндекс ID
    setTimeout(() => {
      setLoading(false);
      alert('Успешная авторизация через Яндекс ID Passport!');
      window.location.href = '/profile'; // Перенаправление в ЛК после входа
    }, 800);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8 rounded-2xl shadow-sm space-y-6">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-gray-900">Вход в систему</h2>
          <p className="text-sm text-gray-500 font-medium">Авторизуйтесь для доступа к личному кабинету</p>
        </div>

        {/* Форма стандартного входа */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email адрес</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@diplom.ru"
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Пароль</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition shadow-sm text-sm disabled:opacity-50"
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
        </form>

        <div className="relative flex py-2 items-center text-xs text-gray-400 uppercase font-bold">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4">Или для продавцов</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Интеграция Яндекс-ID по ТЗ */}
        <button
          onClick={handleYandexOAuth}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-xl transition shadow-sm text-sm disabled:opacity-50"
        >
          <span className="bg-white text-red-600 font-black px-1.5 py-0.5 rounded text-xs">Я</span>
          Войти с Яндекс ID
        </button>

      </div>
    </div>
  );
}
