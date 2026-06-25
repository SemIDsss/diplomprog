'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, User, Calendar, ShoppingBag } from 'lucide-react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { getUser } from '@/lib/auth';

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
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!id) return;
    const user = getUser();
    setIsLoggedIn(!!user);
    fetchProduct();
    fetchReviews();
  }, [id]);

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
      setProduct(json.data?.product || null);
    } catch (e) { console.error(e); }
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
    if (!isLoggedIn) {
      alert('Войдите, чтобы оставить отзыв');
      return;
    }
    setSubmitting(true);
    try {
      const user = getUser();
      if (!user) {
        alert('Войдите в аккаунт');
        setSubmitting(false);
        return;
      }

      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
            userName: user.email || 'Пользователь',
            rating,
            comment: reviewText
          }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      setReviewText('');
      fetchReviews();
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  if (!product) return <div className="flex items-center justify-center min-h-screen">Товар не найден</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container-mobile py-4">
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={64} className="text-gray-300" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
              {product.description && <p className="text-gray-600 mt-2">{product.description}</p>}
              <p className="text-3xl font-black text-blue-600 mt-4">{product.price} ₽</p>
              <AddToCartButton
                productId={product.id}
                productName={product.title}
                productPrice={product.price}
                productImage={product.image}
              />
            </div>
          </div>
        </div>

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

          {isLoggedIn ? (
            <form onSubmit={submitReview} className="mt-6 border-t pt-4">
              <h3 className="font-bold text-gray-800 mb-2">Оставить отзыв</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Оценка:</span>
                {[1,2,3,4,5].map((star) => (
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
                className="mt-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </form>
          ) : (
            <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
              <p>Войдите, чтобы оставить отзыв</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-1 text-blue-600 font-bold hover:underline"
              >
                Войти
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}