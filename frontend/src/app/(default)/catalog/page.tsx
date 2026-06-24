'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AddToCartButton } from '@/components/AddToCartButton';
import { Search, X, Package, Filter } from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';
import CategoryFilter from '@/components/CategoryFilter';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  status: string;
}

interface ProductsResponse {
  items: Product[];
  totalCount: number;
  hasMore: boolean;
}

interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subcategoryId = searchParams.get('subcategoryId') || undefined;
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement | null>(null);

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5000/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query { categories { id name subcategories { id name } } }`
          })
        });
        const json = await res.json();
        if (json.data?.categories) setCategories(json.data.categories);
      } catch (e) { console.error(e); }
    };
    fetchCategories();
  }, []);

  // Бесконечный скролл
  useEffect(() => {
    if (loading) return;
    if (!lastProductRef.current) return;

    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    if (lastProductRef.current) observerRef.current.observe(lastProductRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, products.length]);

  const loadProducts = async (reset: boolean = false, search?: string, subcat?: string) => {
    setLoading(true);
    try {
      const skip = reset ? 0 : products.length;
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProducts($skip: Int, $take: Int, $search: String, $subcategoryId: String) {
              products(skip: $skip, take: $take, search: $search, subcategoryId: $subcategoryId) {
                items { id title description price image status }
                totalCount
                hasMore
              }
            }
          `,
          variables: { skip, take: 10, search: search || '', subcategoryId: subcat || null }
        })
      });
      const json = await res.json();
      const data: ProductsResponse = json.data?.products || { items: [], totalCount: 0, hasMore: false };
      if (reset) {
        setProducts(data.items);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...data.items]);
        setPage(prev => prev + 1);
      }
      setHasMore(data.hasMore);
    } catch (e) {
      console.error('Ошибка загрузки товаров:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) loadProducts(false, inputValue, subcategoryId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (inputValue) params.set('search', inputValue);
    if (subcategoryId) params.set('subcategoryId', subcategoryId);
    router.push(`/catalog?${params.toString()}`);
    setProducts([]);
    setHasMore(true);
    setPage(0);
    if (inputValue.trim()) {
      sendMetricaEvent('search', { query: inputValue.trim() });
      trackEvent('search_performed', { query: inputValue.trim() });
    }
    loadProducts(true, inputValue, subcategoryId);
  };

  useEffect(() => {
    loadProducts(true, searchQuery, subcategoryId);
  }, [subcategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-100 pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Шапка каталога */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-black text-gray-900">Каталог</h1>
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Поиск..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#ff8012] focus:border-transparent"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(''); router.push('/catalog'); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </form>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-xl border border-gray-200"
          >
            <Filter size={16} /> Фильтр
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Фильтр (на десктопе всегда виден, на мобильных — по кнопке) */}
          <div className={`lg:block ${showFilter ? 'block' : 'hidden'} lg:w-64 flex-shrink-0`}>
            <CategoryFilter categories={categories} selectedSubcategoryId={subcategoryId} />
          </div>

          {/* Список товаров */}
          <div className="flex-1">
            {products.length === 0 && !loading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Ничего не найдено</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product, index) => {
                  const isLast = index === products.length - 1;
                  return (
                    <div
                      key={product.id}
                      ref={isLast ? lastProductRef : null}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-100"
                    >
                      <Link href={`/product/${product.id}`}>
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={32} className="text-gray-300" />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{product.title}</h3>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-lg font-bold text-[#ff8012]">{product.price} ₽</span>
                            <AddToCartButton
                              productId={product.id}
                              productName={product.title}
                              productPrice={product.price}
                              productImage={product.image}
                            />
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
            {loading && (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-[#ff8012] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="text-center text-sm text-gray-400 py-4">Все товары загружены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}