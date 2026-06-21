'use client';



import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  status: string;
  subcategoryId: string;
  userId: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; productId: string | null; reason: string }>({
    open: false,
    productId: null,
    reason: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== 'ADMIN') {
        router.push('/buyer');
        return;
      }
      setUser(userData);
    } catch (error) {
      router.push('/login');
      return;
    }
    fetchPendingProducts();
    setLoading(false);
  }, [router]);

  const fetchPendingProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            query GetPendingProducts {
              pendingProducts {
                id
                title
                description
                price
                image
                status
                subcategoryId
                userId
              }
            }
          `
        })
      });
      const json = await res.json();
      if (json.data?.pendingProducts) {
        setProducts(json.data.pendingProducts);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    }
  };

  const handleApprove = async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation ApproveProduct($id: ID!) {
              approveProduct(id: $id)
            }
          `,
          variables: { id: productId }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      sendMetricaEvent('product_approved', { productId });
      trackEvent('product_approved', { 
        productId, 
        moderator: user?.email 
      });

      alert('✅ Товар одобрен!');
      fetchPendingProducts();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleReject = (productId: string) => {
    setModal({ open: true, productId, reason: '' });
  };

  const submitReject = async () => {
    if (!modal.productId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            mutation RejectProduct($id: ID!, $reason: String!) {
              rejectProduct(id: $id, reason: $reason)
            }
          `,
          variables: { id: modal.productId, reason: modal.reason }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      sendMetricaEvent('product_rejected', { 
        productId: modal.productId, 
        reason: modal.reason 
      });
      trackEvent('product_rejected', { 
        productId: modal.productId, 
        reason: modal.reason,
        moderator: user?.email
      });

      alert('❌ Товар отклонён');
      setModal({ open: false, productId: null, reason: '' });
      fetchPendingProducts();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container-mobile py-4 md:py-8">
        <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900">⚙️ Администратор</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                router.push('/login');
              }}
              className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition min-h-[44px]"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Заявки на модерацию</h2>
          {products.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Нет заявок на модерацию</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{product.title}</h3>
                      <p className="text-sm text-gray-500">{product.description || 'Без описания'}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">{product.price} ₽</p>
                      <p className="text-xs text-gray-400">ID: {product.id}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleApprove(product.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm font-bold min-h-[44px]"
                      >
                        ✅ Одобрить
                      </button>
                      <button
                        onClick={() => handleReject(product.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition text-sm font-bold min-h-[44px]"
                      >
                        ❌ Отклонить
                      </button>
                    </div>
                  </div>
                  {product.image && (
                    <img src={product.image} alt={product.title} className="w-24 h-24 object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-2">Укажите причину отказа</h3>
            <textarea
              value={modal.reason}
              onChange={(e) => setModal({ ...modal, reason: e.target.value })}
              placeholder="Причина отклонения товара..."
              className="w-full border rounded-xl p-3 h-24 resize-none text-sm outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setModal({ open: false, productId: null, reason: '' })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={submitReject}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl font-medium hover:bg-red-700 transition"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}