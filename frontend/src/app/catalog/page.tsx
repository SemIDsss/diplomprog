import React from 'react';
import { Sidebar } from '../../components/sidebar';
import { AddToCartButton } from '../../components/AddToCartButton';

interface Subcategory { id: string; name: string; }
interface Category { id: string; name: string; subcategories: Subcategory[]; }
interface Product { id: string; title: string; description?: string; price: number; image?: string; }

interface CatalogPageProps {
  searchParams: {
    subcategoryId?: string;
    search?: string; // Добавили параметр поиска в пропсы страницы
  };
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:5000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query GetCategories { categories { id name subcategories { id name } } }`
      }),
      cache: 'no-store'
    });
    const json = await res.json();
    return json.data?.categories || [];
  } catch (error) { return []; }
}

async function getProducts(subcategoryId?: string, search?: string): Promise<Product[]> {
  try {
    const res = await fetch('http://localhost:5000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetProducts($subcategoryId: String, $search: String) {
            products(subcategoryId: $subcategoryId, search: $search) {
              id
              title
              description
              price
              image
            }
          }
        `,
        variables: { 
          subcategoryId: subcategoryId || null,
          search: search || null 
        }
      }),
      cache: 'no-store'
    });
    const json = await res.json();
    return json.data?.products || [];
  } catch (error) { return []; }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const selectedSubcategory = searchParams?.subcategoryId;
  const searchQuery = searchParams?.search; // Извлекаем поисковый запрос из URL

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(selectedSubcategory, searchQuery) // Передаем текст поиска в функцию загрузки
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-8">
        <Sidebar categories={categories} />
        
        <main className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <h1 className="text-2xl font-black text-gray-900">Каталог товаров</h1>
            
           
            <form method="GET" action="/catalog" className="flex w-full sm:w-72">
              {selectedSubcategory && (
                <input type="hidden" name="subcategoryId" value={selectedSubcategory} />
              )}
              <input
                type="text"
                name="search"
                defaultValue={searchQuery || ''}
                placeholder="Поиск по названию..."
                className="w-full border rounded-l-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 text-gray-800 font-medium"
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-r-xl text-sm transition active:scale-95"
              >
                Найти
              </button>
            </form>
          </div>
          
          {products.length === 0 ? (
            <div className="bg-white border rounded-xl p-12 text-center text-gray-500 shadow-sm">
              <p className="text-lg font-medium">Товары не найдены.</p>
              <p className="text-xs text-gray-400 mt-1">Попробуйте изменить поисковый запрос или выбрать другую категорию.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col p-4">
                  <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-between overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm mx-auto">Нет фото</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{product.title}</h3>
                  {product.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t mt-auto">
                    <span className="text-xl font-black text-blue-600">{product.price} ₽</span>
                    <AddToCartButton productId={product.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
