'use client';

import React, { useState, useEffect } from 'react';

// Описываем типы данных, пришедшие из Prisma через API
interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export default function CatalogPage() {
  // --- СОСТОЯНИЕ Приложения ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- ШАГ 1: Загрузка живого дерева категорий (Книги, Мебель, Игрушки) ---
  useEffect(() => {
    fetch('http://localhost:5000/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка сети');
        return res.json();
      })
      .then((data) => setCategories(data))
      .catch((err) => console.error('Не удалось загрузить категории бэкенда:', err));
  }, []);

  // --- ШАГ 2: Загрузка товаров по выбранному уровню (subcategoryId) ---
  useEffect(() => {
    if (!selectedSubcategory) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/products?subcategoryId=${selectedSubcategory}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка загрузки товаров:', err);
        setLoading(false);
      });
  }, [selectedSubcategory]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 
        ЗДЕСЬ НАХОДИТСЯ ВАШ ОРИГИНАЛЬНЫЙ HEADER / ШАПКА САЙТА. 
        Она сохраняет свои стили.
      */}
      <header className="bg-white border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-2xl font-black text-blue-600 tracking-wider uppercase">Diplom Market</span>
          <div className="space-x-4 text-sm font-medium text-gray-600">
            <a href="/catalog" className="text-blue-600 underline">Каталог</a>
            <a href="/profile" className="hover:text-gray-900">Личный кабинет</a>
          </div>
        </div>
      </header>

      {/* Основной контейнер каталога */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-8">
        
        {/* --- ДИНАМИЧЕСКИЙ САЙДБАР (Вместо старой Электроники) --- */}
        <aside className="w-full md:w-64 bg-white border rounded-xl p-4 shadow-sm shrink-0 self-start">
          <h2 className="text-lg font-bold border-b pb-3 mb-4 text-gray-800">Категории товаров</h2>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id} className="block">
                <button
                  onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                  className="w-full text-left font-semibold p-2 hover:bg-gray-50 rounded-lg transition flex justify-between items-center text-gray-700"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-400">
                    {openCategory === cat.id ? '▼' : '►'}
                  </span>
                </button>

                {/* Вложенные уровни (Манга, Раритет, Кухня, Для собак...) */}
                {openCategory === cat.id && (
                  <ul className="pl-4 mt-1 space-y-1 bg-gray-50/50 rounded-lg p-1">
                    {cat.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <button
                          onClick={() => setSelectedSubcategory(sub.id)}
                          className={`w-full text-left text-sm p-2 rounded-md transition ${
                            selectedSubcategory === sub.id
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          • {sub.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* --- СЕТКА ТОВАРОВ И ВАШИ ОРИГИНАЛЬНЫЕ КАРТОЧКИ --- */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-black text-gray-900">Результаты поиска</h1>
            <span className="text-sm text-gray-500 font-medium">Найдено товаров: {products.length}</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-500 mt-2 font-medium">Загрузка товаров из БД...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center text-gray-500 shadow-sm">
              <p className="text-lg font-medium">Товары не найдены</p>
              <p className="text-sm text-gray-400 mt-1">Выберите подкатегорию в левом меню сайдбара или добавьте тестовые позиции через кабинет продавца.</p>
            </div>
          ) : (
            /* Ваша оригинальная адаптивная сетка карточек */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  {/* Картинка товара */}
                  <div className="h-48 w-full bg-gray-100 relative">
                    <img 
                      src={product.imageUrl || "https://unsplash.com"} 
                      alt={product.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Тело карточки и контент */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{product.title}</h3>
                      <p className="text-gray-500 text-xs mt-1 font-medium">На складе: {product.stock} шт.</p>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">{product.description}</p>
                    </div>

                    {/* Финансовый блок карточки и кнопка добавления в корзину */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xl font-black text-blue-600">{product.price} ₽</span>
                      <button 
                        onClick={() => alert(`Товар "${product.title}" добавлен в корзину!`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

      </div>

      {/* ФУТЕР САЙТА */}
      <footer className="bg-white border-t p-4 mt-auto text-center text-xs text-gray-400 font-medium shadow-inner">
        &copy; 2026 Diplom Market. Все права защищены. Дипломный проект СУБД Prisma 7 & Next.js.
      </footer>
    </div>
  );
}
