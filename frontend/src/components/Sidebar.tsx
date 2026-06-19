'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface SidebarProps {
  categories: Category[];
}

export function Sidebar({ categories = [] }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSubcatId = searchParams.get('subcategoryId');
  
  // Состояние для хранения ID раскрытых категорий (аккордеон)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    // Выполняем переход на URL с параметром, инициируя серверный SSR перезапрос данных
    router.push(`/catalog?subcategoryId=${subcategoryId}`);
  };

  const handleResetFilter = () => {
    router.push('/catalog');
  };

  return (
    <aside className="w-full md:w-64 bg-white border rounded-xl p-4 shadow-sm h-fit">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <h2 className="font-bold text-gray-800 text-lg">Категории</h2>
        {currentSubcatId && (
          <button 
            onClick={handleResetFilter}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Нет доступных категорий</p>
        ) : (
          categories.map((category) => {
            const isOpen = openCategories[category.id] || false;
            
            return (
              <div key={category.id} className="border-b border-gray-100 last:border-0 pb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between py-2 text-left font-semibold text-gray-700 hover:text-blue-600 transition"
                >
                  <span>{category.name}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && category.subcategories && (
                  <div className="pl-4 mt-1 space-y-1 bg-gray-50 rounded-lg p-2 transition-all">
                    {category.subcategories.map((subcat) => {
                      const isSelected = currentSubcatId === subcat.id;
                      
                      return (
                        <button
                          key={subcat.id}
                          onClick={() => handleSubcategorySelect(subcat.id)}
                          className={`w-full text-left py-1.5 px-2 rounded-md text-sm transition ${
                            isSelected
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {subcat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
