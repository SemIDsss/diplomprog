'use client';
import React, { useState, useEffect } from 'react';

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export default function Sidebar({ onSelectSubcategory }: { onSelectSubcategory: (id: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    // В реальном приложении: fetch('/api/categories')
    // Ниже статический массив, полностью соответствующий ТЗ
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Книги',
        subcategories: [
          { id: 'b1', name: 'Манга' },
          { id: 'b2', name: 'Раритет' },
          { id: 'b3', name: 'Классика' }
        ]
      },
      {
        id: '2',
        name: 'Мебель',
        subcategories: [
          { id: 'f1', name: 'Кухня' },
          { id: 'f2', name: 'Гостинная' },
          { id: 'f3', name: 'Дача' },
          { id: 'f4', name: 'Спальня' },
          { id: 'f5', name: 'Раритет' },
          { id: 'f6', name: 'Детская' }
        ]
      },
      {
        id: '3',
        name: 'Игрушки',
        subcategories: [
          { id: 't1', name: 'Детские' },
          { id: 't2', name: 'Мягкие' },
          { id: 't3', name: 'Для собак' },
          { id: 't4', name: 'Для кошек' }
        ]
      }
    ];
    setCategories(mockCategories);
  }, []);

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-4 border-r border-gray-800">
      <h2 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">Каталог товаров</h2>
      <ul className="space-y-3">
        {categories.map((cat) => (
          <li key={cat.id} className="block">
            <button
              onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
              className="w-full text-left font-medium p-2 hover:bg-gray-800 rounded transition flex justify-between items-center"
            >
              <span>{cat.name}</span>
              <span>{openCategory === cat.id ? '▼' : '►'}</span>
            </button>
            
            {openCategory === cat.id && (
              <ul className="pl-4 mt-1 space-y-1 bg-gray-850 rounded">
                {cat.subcategories.map((sub) => (
                  <li key={sub.id}>
                    <button
                      onClick={() => onSelectSubcategory(sub.id)}
                      className="w-full text-left text-sm text-gray-300 p-2 hover:text-white hover:bg-gray-700 rounded transition"
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
  );
}
