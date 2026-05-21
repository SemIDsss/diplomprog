'use client';
import { useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Что-то пошло не так');

      if (isLogin) {
        // Сохраняем защищенный токен в куки на 1 день
        Cookies.set('token', data.token, { expires: 1 });
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/profile'); // Перенаправляем в личный кабинет
      } else {
        alert('Регистрация успешна! Теперь войдите.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2>{isLogin ? 'Вход в личный кабинет' : 'Регистрация'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLogin && (
          <input type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '10px' }} />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px' }} />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px' }} />
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer' }}>
        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  );
}

