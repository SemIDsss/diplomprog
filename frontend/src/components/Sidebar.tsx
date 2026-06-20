'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Subcategory { id: string; name: string; }
interface Category { id: string; name: string; subcategories: Subcategory[]; }

interface SidebarProps {
  categories: Category[];
}

export function Sidebar({ categories }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Мобильная версия - кнопка-гамбургер
  if (categories.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-4 text-center text-gray-400 text-sm">
        Категории не загружены
      </div>
    );
  }

  return (
    <>
      {/* Мобильная кнопка открытия */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full bg-white border rounded-xl p-3 flex items-center justify-between active:scale-[0.98]"
      >
        <span className="font-bold text-gray-800">📂 Категории</span>
        <span className="text-gray-500">{isOpen ? '✕' : '▼'}</span>
      </button>

      {/* Десктопная версия */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block bg-white border rounded-xl p-4 space-y-4 sticky top-20 max-h-[80vh] overflow-y-auto`}>
        <h3 className="font-bold text-gray-800 text-sm hidden md:block">Категории</h3>
        
        <div className="space-y-3">
          {/* Все товары */}
          <Link href="/catalog" className="block text-sm font-medium text-blue-600 hover:underline py-1">
            Все товары
          </Link>
          
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider">
                {category.name}
              </h4>
              <div className="space-y-1 ml-2">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/catalog?subcategoryId=${sub.id}`}
                    className="block text-sm text-gray-600 hover:text-blue-600 hover:underline py-1 active:text-blue-600"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}