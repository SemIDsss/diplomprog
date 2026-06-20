'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent, identifyUser, setUserGroup } from '@/lib/amplitude';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'ADMIN') router.push('/admin');
          else if (user.role === 'SELLER') router.push('/seller');
          else router.push('/buyer');
        } catch (e) {}
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const query = isLogin ? `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user { id email role }
          }
        }
      ` : `
        mutation Register($email: String!, $password: String!, $role: String!) {
          register(email: $email, password: $password, role: $role) {
            token
            user { id email role }
          }
        }
      `;

      const variables = isLogin 
        ? { email, password }
        : { email, password, role };

      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      const data = json.data[isLogin ? 'login' : 'register'];
      if (!data?.token) throw new Error('Ошибка аутентификации');

      // ✅ СОБЫТИЯ
      if (isLogin) {
        sendMetricaEvent('login', { email: data.user.email });
        trackEvent('user_login', { email: data.user.email });
      } else {
        sendMetricaEvent('register', { 
          email: data.user.email, 
          role: data.user.role 
        });
        trackEvent('user_register', { 
          email: data.user.email, 
          role: data.user.role 
        });
      }
      identifyUser(data.user.id, { email: data.user.email, role: data.user.role });
      setUserGroup('role', data.user.role);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user.id);

      const userRole = data.user.role;
      if (userRole === 'ADMIN') router.push('/admin');
      else if (userRole === 'SELLER') router.push('/seller');
      else router.push('/buyer');
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 md:p-8">
        <h1 className="text-3xl font-black text-center text-gray-900 mb-2">
          {isLogin ? 'Вход' : 'Регистрация'}
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-gray-50 rounded-xl py-4 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-blue-500/30 border border-gray-200"
              required
            />
          </div>

          <div className="relative">
            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full bg-gray-50 rounded-xl py-4 pl-10 pr-12 text-base outline-none focus:ring-2 focus:ring-blue-500/30 border border-gray-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-gray-50 rounded-xl py-4 px-4 text-base outline-none focus:ring-2 focus:ring-blue-500/30 border border-gray-200"
              >
                <option value="USER">Покупатель</option>
                <option value="SELLER">Продавец</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Администратор создаётся вручную</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}