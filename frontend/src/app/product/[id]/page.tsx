'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, User, Calendar, Package } from 'lucide-react';
import { AddToCartButton } from '@/components/AddToCartButton';
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

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
    if (!id) {
      router.push('/catalog');
      return;
    }
    fetchProduct();
    fetchReviews();
  }, [id, router]);

  const fetchProduct = async () => {
    try {
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                id title description price image status
              }
            }
          `,
          variables: { id }
        })
      });
      const json = await res.json();
      if (json.data?.product) {
        setProduct(json.data.product);
      } else {
        router.push('/catalog');
      }
    } catch (e) {
      console.error(e);
      router.push('/catalog');
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetReviews($productId: ID!) {
              reviews(productId: $productId) {
                id userName rating comment createdAt
              }
            }
          `,
          variables: { productId: id }
        })
      });
      const json = await res.json();
      setReviews(json.data?.reviews || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Войдите, чтобы оставить отзыв');
        setSubmitting(false);
        return;
      }
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation CreateReview($productId: ID!, $userName: String!, $rating: Int!, $comment: String!) {
              createReview(productId: $productId, userName: $userName, rating: $rating, comment: $comment) {
                id
              }
            }
          `,
          variables: {
            productId: id,
            userName: user?.email || 'Покупатель',
            rating,
            comment: reviewText
          }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      // ✅ СОБЫТИЕ: добавление отзыва
      sendMetricaEvent('add_review', {
        productId: id,
        rating,
        productName: product?.title
      });
      trackEvent('review_added', {
        productId: id,
        rating,
        productName: product?.title,
        userId: user?.id
      });

      setReviewText('');
      fetchReviews();
      alert('✅ Отзыв отправлен!');
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 text-sm">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Товар не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container-mobile py-4">
        {/* Карточка товара */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <Package size={64} className="text-gray-300" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
              {product.description && <p className="text-gray-600 mt-2">{product.description}</p>}
              <p className="text-3xl font-black text-blue-600 mt-4">{product.price} ₽</p>
              <div className="mt-4">
                <AddToCartButton
                  productId={product.id}
                  productName={product.title}
                  productPrice={product.price}
                  productImage={product.image}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Отзывы */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Отзывы покупателей</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-400">Пока нет отзывов. Будьте первым!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b pb-3">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-400" />
                    <span className="font-semibold text-gray-800">{rev.userName}</span>
                    <span className="text-xs text-gray-400">
                      <Calendar size={14} className="inline mr-1" />
                      {new Date(Number(rev.createdAt)).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                  <p className="text-gray-700 mt-1">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления отзыва */}
          <form onSubmit={submitReview} className="mt-6 border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-2">Оставить отзыв</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Оценка:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star size={24} className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Поделитесь впечатлениями..."
              rows={3}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
            />
            <button
              type="submit"
              disabled={submitting || !reviewText.trim()}
              className="mt-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}