'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent, identifyUser, setUserGroup } from '@/lib/amplitude';
import { setUser } from '@/lib/auth';
import { API_URL, API_BASE } from '@/lib/api'; 

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'ADMIN') router.push('/admin');
        else if (user.role === 'SELLER') router.push('/seller');
        else router.push('/buyer');
      } catch (e) {}
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
            user { id email role }
          }
        }
      ` : `
        mutation Register($email: String!, $password: String!, $role: String!) {
          register(email: $email, password: $password, role: $role) {
            user { id email role }
          }
        }
      `;

      const variables = isLogin 
        ? { email, password }
        : { email, password, role };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, variables })
      });

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      const data = json.data[isLogin ? 'login' : 'register'];
      if (!data?.user) throw new Error('Ошибка получения пользователя');

      setUser(data.user);
      localStorage.setItem('userId', data.user.id);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#ff8012]">DIPLOM</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-gray-50 rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#ff8012] border border-gray-200"
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
              className="w-full bg-gray-50 rounded-xl py-3.5 pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#ff8012] border border-gray-200"
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
                className="w-full bg-gray-50 rounded-xl py-3.5 px-4 text-sm outline-none focus:ring-2 focus:ring-[#ff8012] border border-gray-200"
              >
                <option value="USER">Покупатель</option>
                <option value="SELLER">Продавец</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff8012] hover:bg-[#e06a00] text-white font-bold py-3.5 rounded-xl transition text-sm disabled:opacity-70"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-[#ff8012] hover:underline"
          >
            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}