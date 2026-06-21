'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, TrendingUp, Star, Shield, Truck, 
  BookOpen, Sofa, ToyBrick, LogIn, User, ShoppingBag 
} from 'lucide-react';

const categories = [
  { id: 'books', title: 'Книги', icon: <BookOpen size={32} className="text-blue-600" />, count: '12+', color: 'bg-blue-50', link: '/catalog?category=books' },
  { id: 'furniture', title: 'Мебель', icon: <Sofa size={32} className="text-amber-600" />, count: '8+', color: 'bg-amber-50', link: '/catalog?category=furniture' },
  { id: 'toys', title: 'Игрушки', icon: <ToyBrick size={32} className="text-rose-500" />, count: '10+', color: 'bg-rose-50', link: '/catalog?category=toys' },
];

const advantages = [
  { icon: <TrendingUp size={24} className="text-blue-600" />, label: 'Выгодные цены', desc: 'Цены ниже рыночных' },
  { icon: <Star size={24} className="text-yellow-500" />, label: 'Только лучшее', desc: 'Проверенные товары' },
  { icon: <Shield size={24} className="text-green-600" />, label: 'Гарантия', desc: '100% возврат средств' },
  { icon: <Truck size={24} className="text-purple-600" />, label: 'Быстрая доставка', desc: 'Доставка за 1-3 дня' },
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserName(user.email || 'Пользователь');
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-10 md:py-14">
        <div className="container-mobile text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
            <span className="text-yellow-300">✦</span> Новая коллекция
          </div>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            Покупай <br className="block md:hidden"/> с умом
          </h1>
          <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto font-medium">
            Книги, мебель и игрушки с гарантией качества
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/catalog"
              className="bg-white text-blue-600 font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition active:scale-95 min-h-[48px] flex items-center justify-center gap-2"
            >
              В каталог <ArrowRight size={18} />
            </Link>
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="bg-white/20 text-white font-bold px-8 py-3.5 rounded-2xl border border-white/30 hover:bg-white/30 transition active:scale-95 min-h-[48px] flex items-center justify-center gap-2"
              >
                <LogIn size={18} /> Войти
              </Link>
            ) : (
              <Link
                href="/buyer"
                className="bg-white/20 text-white font-bold px-8 py-3.5 rounded-2xl border border-white/30 hover:bg-white/30 transition active:scale-95 min-h-[48px] flex items-center justify-center gap-2"
              >
                <User size={18} /> {userName.split('@')[0]}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="container-mobile -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {advantages.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100/80 hover:shadow-md transition">
              <div className="flex justify-center mb-1">{item.icon}</div>
              <p className="text-sm font-bold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-mobile py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Категории</h2>
          <Link href="/catalog" className="text-sm font-medium text-blue-600 hover:underline">
            Все товары →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.link}
              className={`${cat.color} rounded-2xl p-5 text-center hover:shadow-md transition active:scale-95 border border-transparent hover:border-gray-200`}
            >
              <div className="flex justify-center mb-1">{cat.icon}</div>
              <h3 className="font-bold text-sm text-gray-800">{cat.title}</h3>
              <p className="text-xs text-gray-400">{cat.count} товаров</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}