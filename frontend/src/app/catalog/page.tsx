'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

const API_GRAPHQL = 'http://localhost:4000/graphql';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
  ratingAvg?: number;
  sku?: string;
  brand?: string;
  weightGrams?: number;
  widthMm?: number;
  heightMm?: number;
  lengthMm?: number;
  reviews?: Review[];
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  // Исправлено: Флаг предотвращения багов гидратации
  const [isMounted, setIsMounted] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory
  );
  const [selectedProduct, setSelectedProduct] = useState<
    Product | null
  >(null);

  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadCatalog = async (queryStr = '', catStr = '') => {
    setLoading(true);
    try {
      const graphqlQuery = {
        query: `
          query GetProducts($q: String, $c: String) {
            searchProducts(query: $q, category: $c) {
              id name price stock category description image ratingAvg
              sku brand weightGrams widthMm heightMm lengthMm
              reviews { id userName rating comment createdAt }
            }
          }
        `,
        variables: { q: queryStr || null, c: catStr || null }
      };

      const res = await fetch(API_GRAPHQL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graphqlQuery)
      });
      const json = await res.json();
      if (json.data?.searchProducts) {
        setProducts(json.data.searchProducts);
      }
    } catch (err) {
      console.error('❌ [GraphQL Catalog Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true); // Страница успешно монтирована на клиенте
    loadCatalog(searchQuery, selectedCategory);
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCatalog(searchQuery, selectedCategory);
  };
  const handleAddToCart = (product: Product) => {
    try {
      const existingCart = localStorage.getItem('cart');
      const cartItems = existingCart ? JSON.parse(existingCart) : [];
      
      const targetIndex = cartItems.findIndex(
        (i: any) => i.id === product.id
      );
      // Безопасное клонирование через Object.assign вместо util._extend
      if (targetIndex > -1) {
        cartItems[targetIndex].quantity += 1;
      } else {
        const newItem = Object.assign({}, product, { quantity: 1 });
        cartItems.push(newItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(cartItems));
      alert(`🛒 ${product.name} успешно добавлен в корзину!`);
    } catch {
      alert('Ошибка при сохранении в корзину');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    if (!reviewComment.trim()) {
      setReviewError('Комментарий пуст');
      return;
    }

    const token =
      Cookies.get('token') || localStorage.getItem('token');
    if (!token) {
      setReviewError('Ошибка: Авторизуйтесь для публикации отзыва.');
      return;
    }

    try {
      const graphqlMutation = {
        query: `
          mutation AddReview($pId: ID!, $cmt: String!, $rt: Int!, $anon: Boolean!, $ua: String) {
            createReview(productId: $pId, comment: $cmt, rating: $rt, isAnonymous: $anon, userAgent: $ua) {
              id userName rating comment createdAt
            }
          }
        `,
        variables: {
          pId: selectedProduct?.id,
          cmt: reviewComment.trim(),
          rt: reviewRating,
          anon: isAnonymous,
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web'
        }
      };

      const res = await fetch(API_GRAPHQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(graphqlMutation)
      });

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors.message);
      }

      setReviewSuccess(true);
      setReviewComment('');
      loadCatalog(searchQuery, selectedCategory);
      setSelectedProduct(null);
    } catch (err: any) {
      setReviewError(err.message || 'Ошибка отправки отзыва');
    }
  };

  // Защита: Если Next.js рендерит серверную разметку, ждем монтирования
  if (!isMounted) {
    return <div className="text-center py-12 font-bold text-slate-500">Загрузка витрины маркетплейса...</div>;
  }

  return (
    <div className="w-full px-4 py-4 max-w-7xl mx-auto font-sans pb-24 md:pb-6">
      <div className="w-full bg-white border border-slate-200 p-4 rounded-2xl mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text"
            placeholder="Поиск гаджетов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl text-sm min-h-[44px]"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm bg-white min-h-[44px]"
          >
            <option value="">Все категории</option>
            <option value="Электроника">Электроника</option>
            <option value="Гаджеты">Гаджеты</option>
            <option value="Аудио">Аудио</option>
            <option value="Компьютеры">Компьютеры</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white font-bold px-6 rounded-xl text-sm min-h-[44px]">
            Искать
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold text-sm">
          Считывание GraphQL спецификаций...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {products.map((product) => (
            <article 
              key={product.id}
              className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-400 text-xs font-bold" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {product.category}
                </span>
                <h3 className="font-bold text-slate-900 text-sm md:text-base mt-1.5 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-amber-500 text-xs">⭐</span>
                  <span className="text-xs font-bold text-slate-600">{product.ratingAvg || '0'}</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t flex items-center justify-between">
                <span className="font-black text-slate-950 text-sm md:text-base">
                  {product.price.toLocaleString('ru-RU')} ₽
                </span>
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="text-blue-600 text-xs font-black min-h-[44px] flex items-center"
                >
                  Подробнее
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {/* КОРРЕКТНОЕ ОТОБРАЖЕНИЕ КАРТОЧКИ: Проверка наличия объекта selectedProduct */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-slate-100 text-slate-700 rounded-full font-black text-sm flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              ✕
            </button>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {selectedProduct.category}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-2">
                {selectedProduct.name}
              </h2>
              {selectedProduct.brand && (
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Бренд: {selectedProduct.brand} • Артикул: {selectedProduct.sku}
                </p>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-800 uppercase mb-2">Описание гаджета</h4>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedProduct.description || 'Технические характеристики заполняются продавцом.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-blue-50/40 p-3 rounded-xl border border-blue-50 text-xs">
              <div>📦 <span className="font-bold text-slate-600">Вес брутто:</span> {selectedProduct.weightGrams || 0} г</div>
              <div>📐 <span className="font-bold text-slate-600">Габариты:</span> {selectedProduct.lengthMm || 0}х{selectedProduct.widthMm || 0}х{selectedProduct.heightMm || 0} мм</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Финальная стоимость:</span>
                <span className="text-lg font-black text-blue-400">{selectedProduct.price.toLocaleString('ru-RU')} ₽</span>
              </div>
              <button 
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 rounded-xl min-h-[44px] transition-transform active:scale-95"
              >
                🛒 Добавить в корзину
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h4 className="font-black text-slate-900 text-sm">
                Отзывы реальных покупателей ({selectedProduct.reviews?.length || 0})
              </h4>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                  selectedProduct.reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50/60 p-3 rounded-xl border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-800">{rev.userName}</span>
                        <span className="text-xs font-bold text-amber-500">⭐ {rev.rating}</span>
                      </div>
                      <p className="text-xs text-slate-600">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Отзывов пока нет.</p>
                )}
              </div>

              <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-4 rounded-2xl space-y-3 border">
                <div className="flex items-center gap-3">
                  <select 
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
                    className="bg-white border rounded-lg text-xs font-bold p-1 min-h-[44px]"
                  >
                    <option value="5">5 ⭐</option>
                    <option value="4">4 ⭐</option>
                    <option value="3">3 ⭐</option>
                    <option value="2">2 ⭐</option>
                    <option value="1">1 ⭐</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer min-h-[44px]">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded text-blue-600" />
                    <span>Анонимно</span>
                  </label>
                </div>
                {reviewError && <div className="text-xs font-bold text-red-600">⚠ {reviewError}</div>}
                {reviewSuccess && <div className="text-xs font-bold text-green- green-600">✔ Опубликован!</div>}
                <textarea
                  placeholder="Напишите честный отзыв..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3 border rounded-xl text-xs bg-white min-h-[60px]"
                />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-xl min-h-[44px]">
                  Опубликовать отзыв
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 font-bold text-sm">Инициализация...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
