'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10">
        <h1 className="text-3xl font-black text-[#ff8012] mb-6">О нас</h1>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            <strong>DIPLOM</strong> — это современный маркетплейс, созданный для удобных и безопасных покупок.
            Мы объединяем проверенных продавцов и покупателей со всей России.
          </p>
          <p>
            Наша миссия — сделать онлайн-шопинг простым, быстрым и прозрачным.
            Мы тщательно отбираем товары, следим за качеством обслуживания и предлагаем гибкие способы оплаты и доставки.
          </p>
          <p>
            Проект разработан в рамках выпускной квалификационной работы и демонстрирует все этапы создания
            полноценного интернет-магазина: от проектирования архитектуры до промышленного деплоя.
          </p>
          <p className="font-medium text-[#ff8012]">
            Свяжитесь с нами, если у вас есть вопросы или предложения — мы всегда на связи!
          </p>
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