'use client';
import React, { useState } from 'react';

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export default function AuthPage() {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'LOGIN') {
      alert(`Вход выполнен для: ${email}`);
      window.location.href = '/profile';
    } else if (view === 'REGISTER') {
      if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
      }
      alert(`Успешная регистрация аккаунта: ${email}`);
      setView('LOGIN');
    } else {
      alert(`Ссылка для сброса пароля отправлена на почту: ${email}`);
      setView('LOGIN');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
        
        {/* Заголовки в зависимости от режима */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-gray-900">
            {view === 'LOGIN' && 'Вход в систему'}
            {view === 'REGISTER' && 'Регистрация аккаунта'}
            {view === 'FORGOT_PASSWORD' && 'Восстановление пароля'}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            {view === 'LOGIN' && 'Введите свои данные для авторизации'}
            {view === 'REGISTER' && 'Создайте учетную запись клиента'}
            {view === 'FORGOT_PASSWORD' && 'Укажите email для получения ссылки сброса'}
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xxs font-bold text-gray-400 uppercase mb-1">Email адрес</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full border p-2.5 rounded-xl text-xs outline-none focus:border-blue-500" 
              placeholder="name@diplom.ru" 
              required 
            />
          </div>

          {view !== 'FORGOT_PASSWORD' && (
            <div>
              <label className="block text-xxs font-bold text-gray-400 uppercase mb-1">Пароль</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs outline-none focus:border-blue-500" 
                placeholder="••••••••" 
                required 
              />
            </div>
          )}

          {view === 'REGISTER' && (
            <div>
              <label className="block text-xxs font-bold text-gray-400 uppercase mb-1">Повторите пароль</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-xs outline-none focus:border-blue-500" 
                placeholder="••••••••" 
                required 
              />
            </div>
          )}

          {view === 'LOGIN' && (
            <div className="text-right">
              <button 
                type="button" 
                onClick={() => setView('FORGOT_PASSWORD')}
                className="text-xxs font-bold text-blue-600 hover:underline"
              >
                Забыли пароль?
              </button>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl text-xs transition">
            {view === 'LOGIN' && 'Войти в личный кабинет'}
            {view === 'REGISTER' && 'Зарегистрироваться'}
            {view === 'FORGOT_PASSWORD' && 'Получить ссылку'}
          </button>
        </form>

        {/* Переключатели режимов */}
        <div className="text-center text-xs space-y-2 border-t pt-4">
          {view === 'LOGIN' ? (
            <p className="text-gray-500">
              Ещё нет аккаунта?{' '}
              <button onClick={() => setView('REGISTER')} className="text-blue-600 font-bold hover:underline">
                Зарегистрироваться
              </button>
            </p>
          ) : (
            <p className="text-gray-500">
              Уже есть аккаунт?{' '}
              <button onClick={() => setView('LOGIN')} className="text-blue-600 font-bold hover:underline">
                Вернуться ко входу
              </button>
            </p>
          )}
        </div>

        {/* Разделитель и Яндекс ID для ТЗ */}
        {view === 'LOGIN' && (
          <>
            <div className="relative flex py-1 items-center text-xxs text-gray-400 uppercase font-bold">
              <div className="flex-grow border-t"></div>
              <span className="mx-3">Для продавцов</span>
              <div className="flex-grow border-t"></div>
            </div>
            <button
              type="button"
              onClick={() => {
                alert('Вход через Яндекс ID выполнен!');
                window.location.href = '/profile';
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold p-2.5 rounded-xl text-xs transition"
            >
              <span className="bg-white text-red-600 font-black px-1 rounded text-xxs">Я</span>
              Войти с Яндекс ID
            </button>
          </>
        )}

      </div>
    </div>
  );
}
