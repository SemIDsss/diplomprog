'use client';



import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { AddToCartButton } from '@/components/AddToCartButton';
import { Search, X, Package } from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';

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

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!lastProductRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    });

    if (lastProductRef.current) {
      observerRef.current.observe(lastProductRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, products.length]);

  const loadProducts = async (reset: boolean = false, search?: string) => {
    setLoading(true);
    try {
      const skip = reset ? 0 : products.length;
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProducts($skip: Int, $take: Int, $search: String) {
              products(skip: $skip, take: $take, search: $search) {
                items { id title description price image status }
                totalCount
                hasMore
              }
            }
          `,
          variables: { skip, take: 10, search: search || '' }
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
    if (!loading && hasMore) {
      loadProducts(false, searchQuery);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputValue);
    setProducts([]);
    setHasMore(true);
    setPage(0);

    if (inputValue.trim()) {
      sendMetricaEvent('search', { query: inputValue.trim() });
      trackEvent('search_performed', { query: inputValue.trim() });
    }

    loadProducts(true, inputValue);
  };

  useEffect(() => {
    loadProducts(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container-mobile py-4 flex flex-col justify-center">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Найти товары..."
              className="w-full bg-gray-100 rounded-2xl pl-14 pr-14 py-5 text-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30 transition placeholder:text-gray-400"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(''); setSearchQuery(''); loadProducts(true); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            )}
          </form>
          {searchQuery && (
            <div className="text-base text-gray-500 mt-2">
              По запросу <span className="font-semibold text-gray-800">"{searchQuery}"</span> найдено {products.length} товаров
            </div>
          )}
        </div>
      </div>

      <div className="container-mobile py-4">
        {products.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Package size={56} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Ничего не найдено</h3>
            <p className="text-base text-gray-400 mt-1">Попробуйте изменить поисковый запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, index) => {
              const isLast = index === products.length - 1;
              return (
                <div
                  key={product.id}
                  ref={isLast ? lastProductRef : null}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-200 active:scale-[0.98] border border-gray-100"
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={48} className="text-gray-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-base text-gray-800 line-clamp-2 min-h-[3rem]">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="text-lg font-bold text-blue-600">
                          {product.price.toLocaleString()} ₽
                        </span>
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
          <div className="text-center py-4">
            <span className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <div className="text-center text-sm text-gray-400 py-4">
            Вы просмотрели все товары
          </div>
        )}
      </div>
    </div>
  );
}