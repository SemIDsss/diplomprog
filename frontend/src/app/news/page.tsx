'use client';

import Link from 'next/link';

export default function NewsPage() {
  const newsItems = [
    {
      date: '22 июня 2026',
      title: 'Запуск маркетплейса DIPLOM',
      description: 'Мы рады объявить о запуске нашего сервиса. Теперь вы можете покупать и продавать товары в несколько кликов.',
    },
    {
      date: '20 июня 2026',
      title: 'Подключена оплата через ЮKassa и СБП',
      description: 'Добавлены безопасные способы оплаты: банковские карты и Система быстрых платежей.',
    },
    {
      date: '15 июня 2026',
      title: 'Новые категории товаров',
      description: 'В каталоге появились разделы «Электроника», «Одежда» и «Игрушки» с подкатегориями.',
    },
    {
      date: '10 июня 2026',
      title: 'Режим продавца и админ-панель',
      description: 'Теперь продавцы могут управлять своими товарами, а администраторы — модерировать контент.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10">
        <h1 className="text-3xl font-black text-[#ff8012] mb-6">Новости</h1>
        <div className="space-y-6">
          {newsItems.map((item, idx) => (
            <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
              <p className="text-xs text-gray-400 mb-1">{item.date}</p>
              <h2 className="text-xl font-bold text-gray-800">{item.title}</h2>
              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="inline-block mt-6 bg-[#ff8012] text-white font-bold py-2 px-6 rounded-xl hover:bg-[#e06a00] transition"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}