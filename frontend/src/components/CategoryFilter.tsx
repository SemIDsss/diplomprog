'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export default function CategoryFilter({ categories, selectedSubcategoryId }: { categories: Category[], selectedSubcategoryId?: string }) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-3">Категории</h3>
      <ul className="space-y-2">
        <li>
          <Link
            href="/catalog"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
              !selectedSubcategoryId ? 'bg-[#ff8012] text-white' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            Все товары
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              onClick={() => toggleCategory(category.id)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <span>{category.name}</span>
              {expandedCategories.includes(category.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {expandedCategories.includes(category.id) && (
              <ul className="ml-4 mt-1 space-y-1">
                {category.subcategories.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/catalog?subcategoryId=${sub.id}`}
                      className={`block px-3 py-1.5 rounded-lg text-sm transition ${
                        selectedSubcategoryId === sub.id ? 'bg-[#ff8012] text-white' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}