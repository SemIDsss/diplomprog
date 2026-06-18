'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin
      ? '/api/auth/login'
      : '/api/auth/register';

    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка');
      }

      if (isLogin) {
        // Запись в куки для серверного рендеринга (SSR)
        Cookies.set('token', data.token, { expires: 1 });
        // ИСПРАВЛЕНО: Запись в localStorage для обхода CORS-блокировок портов
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/profile');
      } else {
        setIsLogin(true);
        alert('Успешная регистрация! Теперь войдите.');
      }
    } catch (err: any) {
      setError(err.message || 'Сбой сети');
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-6 rounded-2xl border mt-12">
      <h2 className="font-black text-slate-900 text-xl mb-4">
        {isLogin ? 'Вход в TechMarket' : 'Регистрация'}
      </h2>
      {error && <div className="text-xs font-bold text-red-600 mb-2">⚠ {error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-xl text-sm h-11" />}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border rounded-xl text-sm h-11" />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border rounded-xl text-sm h-11" />
        <button type="submit" className="w-full bg-blue-600 text-white font-bold p-2.5 rounded-xl h-11">
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-blue-600 font-bold mt-4 block mx-auto hover:underline">
        {isLogin ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  );
}
