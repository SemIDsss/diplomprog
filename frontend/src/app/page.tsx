import React from 'react';

export default function HomePage() {
  return (
    <div className="space-y-12 pb-12">
      {/* Главный промо-баннер (Hero Section) */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Современный маркетплейс <br className="hidden md:block"/> нового поколения
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Покупайте книги, мебель и игрушки с гарантией модерации качества администрацией и безопасным входом.
          </p>
          <div className="pt-4">
            <a 
              href="/catalog" 
              className="inline-block bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-0.5"
            >
              Перейти в каталог →
            </a>
          </div>
        </div>
      </section>

      {/* Сетка категорий ТЗ */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 text-center">Наши категории товаров</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 border rounded-2xl shadow-sm hover:shadow-md transition space-y-4">
            <div className="text-4xl">📚</div>
            <h3 className="text-xl font-bold">Книги</h3>
            <p className="text-sm text-gray-500">Уникальные коллекции: Манга, классическая литература и редкий книжный раритет.</p>
            <a href="/catalog" className="text-sm font-semibold text-blue-600 hover:underline inline-block">Смотреть книги →</a>
          </div>

          <div className="bg-white p-6 border rounded-2xl shadow-sm hover:shadow-md transition space-y-4">
            <div className="text-4xl">🪑</div>
            <h3 className="text-xl font-bold">Мебель</h3>
            <p className="text-sm text-gray-500">Решения для интерьера: уютные кухни, гостиные, спальни, детские и дачные гарнитуры.</p>
            <a href="/catalog" className="text-sm font-semibold text-blue-600 hover:underline inline-block">Смотреть мебель →</a>
          </div>

          <div className="bg-white p-6 border rounded-2xl shadow-sm hover:shadow-md transition space-y-4">
            <div className="text-4xl">🧸</div>
            <h3 className="text-xl font-bold">Игрушки</h3>
            <p className="text-sm text-gray-500">Радость для всех: развивающие детские, мягкие игрушки, а также товары для кошек и собак.</p>
            <a href="/catalog" className="text-sm font-semibold text-blue-600 hover:underline inline-block">Смотреть игрушки →</a>
          </div>

        </div>
      </section>
    </div>
  );
}
