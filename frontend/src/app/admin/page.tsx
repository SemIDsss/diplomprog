'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Package, ShoppingBag, Star, 
  Plus, Trash2, Edit, Eye, CheckCircle, XCircle,
  Clock, DollarSign, TrendingUp, UserCheck, UserX,
  Filter, Search, ChevronDown, MoreVertical,
  LogOut
} from 'lucide-react';

// ==================== ТИПЫ ====================
interface User {
  id: string;
  email: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  createdAt: string;
  _count?: { products: number; orders: number };
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  subcategoryId: string;
  userId: string;
  user?: { email: string };
  rejectReason?: string;
}

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  deliveryMethod: string;
  deliveryPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'DELIVERED';
  createdAt: string;
  user?: { email: string };
  items?: { id: string; quantity: number; price: number; product: { title: string } }[];
}

interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  product?: { title: string };
}

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingProducts: number;
}

// ==================== КОМПОНЕНТЫ ====================

// Статистика
function StatsCards({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Пользователи', value: stats.totalUsers, icon: <Users size={24} />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Товары', value: stats.totalProducts, icon: <Package size={24} />, color: 'bg-green-50 text-green-600' },
    { label: 'Заказы', value: stats.totalOrders, icon: <ShoppingBag size={24} />, color: 'bg-purple-50 text-purple-600' },
    { label: 'Выручка', value: `${stats.totalRevenue} ₽`, icon: <DollarSign size={24} />, color: 'bg-amber-50 text-amber-600' },
    { label: 'На модерации', value: stats.pendingProducts, icon: <Clock size={24} />, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-xl ${item.color}`}>{item.icon}</div>
            <span className="text-2xl font-black text-gray-800">{item.value}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// Модальное окно
function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==================== ГЛАВНЫЙ КОМПОНЕНТ ====================
export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'categories' | 'reviews' | 'users' | 'moderation'>('stats');

  // Данные
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingProducts: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [modal, setModal] = useState<{ open: boolean; type: string; data: any }>({ open: false, type: '', data: null });

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
    fetchAllData();
    setLoading(false);
  }, [router]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchProducts(),
      fetchOrders(),
      fetchCategories(),
      fetchReviews()
    ]);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            query GetStats {
              userCount
              productCount
              orderCount
              totalRevenue
              pendingProducts: productsCount(status: PENDING)
            }
          `
        })
      });
      const json = await res.json();
      if (json.data) {
        setStats({
          totalUsers: json.data.userCount || 0,
          totalProducts: json.data.productCount || 0,
          totalOrders: json.data.orderCount || 0,
          totalRevenue: json.data.totalRevenue || 0,
          pendingProducts: json.data.pendingProducts || 0
        });
      }
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            query GetUsers {
              users {
                id email role createdAt
                _count { products orders }
              }
            }
          `
        })
      });
      const json = await res.json();
      if (json.data?.users) setUsers(json.data.users);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            query GetProducts {
              productsAll {
                id title description price image status subcategoryId userId rejectReason
                user { email }
              }
            }
          `
        })
      });
      const json = await res.json();
      if (json.data?.productsAll) setProducts(json.data.productsAll);
    } catch (e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            query GetOrders {
              ordersAll {
                id userId totalAmount deliveryMethod deliveryPrice status createdAt
                user { email }
                items { id quantity price product { title } }
              }
            }
          `
        })
      });
      const json = await res.json();
      if (json.data?.ordersAll) setOrders(json.data.ordersAll);
    } catch (e) { console.error(e); }
  };

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

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            query GetReviews {
              reviewsAll {
                id productId userName rating comment createdAt
                product { title }
              }
            }
          `
        })
      });
      const json = await res.json();
      if (json.data?.reviewsAll) setReviews(json.data.reviewsAll);
    } catch (e) { console.error(e); }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            mutation UpdateUserRole($userId: ID!, $role: String!) {
              updateUserRole(userId: $userId, role: $role) { id role }
            }
          `,
          variables: { userId, role: newRole }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      fetchUsers();
    } catch (e: any) { alert('Ошибка: ' + e.message); }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
              updateOrderStatus(orderId: $orderId, status: $status) { id status }
            }
          `,
          variables: { orderId, status }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      fetchOrders();
    } catch (e: any) { alert('Ошибка: ' + e.message); }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            mutation DeleteReview($id: ID!) {
              deleteReview(id: $id)
            }
          `,
          variables: { id: reviewId }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      fetchReviews();
    } catch (e: any) { alert('Ошибка: ' + e.message); }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Удалить категорию и все подкатегории?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            mutation DeleteCategory($id: ID!) {
              deleteCategory(id: $id)
            }
          `,
          variables: { id: categoryId }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      fetchCategories();
    } catch (e: any) { alert('Ошибка: ' + e.message); }
  };

  const handleLogout = () => {
    ['token', 'user', 'userId', 'cart'].forEach(key => localStorage.removeItem(key));
    router.push('/login');
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
      {/* Шапка */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container-mobile py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Панель администратора</h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 px-3 py-1.5 bg-red-50 rounded-xl hover:bg-red-100 transition"
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </div>

      <div className="container-mobile py-4">
        {/* Вкладки */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'stats', label: '📊 Статистика' },
            { id: 'orders', label: '📦 Заказы' },
            { id: 'categories', label: '📂 Категории' },
            { id: 'reviews', label: '⭐ Отзывы' },
            { id: 'users', label: '👤 Пользователи' },
            { id: 'moderation', label: '📋 Модерация' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Статистика */}
        {activeTab === 'stats' && <StatsCards stats={stats} />}

        {/* Заказы */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📦 Все заказы</h2>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Заказов нет</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Заказ</th>
                      <th className="p-2 text-left">Покупатель</th>
                      <th className="p-2 text-left">Сумма</th>
                      <th className="p-2 text-left">Доставка</th>
                      <th className="p-2 text-left">Статус</th>
                      <th className="p-2 text-left">Дата</th>
                      <th className="p-2 text-left">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="p-2 font-mono text-xs">#{order.id.substring(0, 8)}</td>
                        <td className="p-2">{order.user?.email || 'Unknown'}</td>
                        <td className="p-2 font-bold text-blue-600">{order.totalAmount} ₽</td>
                        <td className="p-2">{order.deliveryMethod} ({order.deliveryPrice} ₽)</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            order.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'DELIVERED' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2 text-xs text-gray-400">
                          {new Date(Number(order.createdAt)).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-2">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs bg-gray-50 rounded-lg px-2 py-1 border"
                          >
                            <option value="PENDING">В обработке</option>
                            <option value="APPROVED">Оплачен</option>
                            <option value="SHIPPED">В пути</option>
                            <option value="DELIVERED">Доставлен</option>
                            <option value="REJECTED">Отменён</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Категории */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">📂 Категории</h2>
              <button
                onClick={() => setModal({ open: true, type: 'category', data: null })}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              >
                <Plus size={18} /> Добавить
              </button>
            </div>
            {categories.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Категорий нет</p>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="border rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">{cat.name}</span>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cat.subcategories.map((sub) => (
                        <span key={sub.id} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Отзывы */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">⭐ Отзывы</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Отзывов нет</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{review.userName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(Number(review.createdAt)).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="text-yellow-500">⭐ {review.rating}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">Товар: {review.product?.title || 'Unknown'}</p>
                      </div>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👤 Пользователи</h2>
            {users.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Пользователей нет</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">Роль</th>
                      <th className="p-2 text-left">Товаров</th>
                      <th className="p-2 text-left">Заказов</th>
                      <th className="p-2 text-left">Дата</th>
                      <th className="p-2 text-left">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                            u.role === 'SELLER' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2">{u._count?.products || 0}</td>
                        <td className="p-2">{u._count?.orders || 0}</td>
                        <td className="p-2 text-xs text-gray-400">
                          {new Date(Number(u.createdAt)).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="p-2">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="text-xs bg-gray-50 rounded-lg px-2 py-1 border"
                          >
                            <option value="USER">Покупатель</option>
                            <option value="SELLER">Продавец</option>
                            <option value="ADMIN">Админ</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Модерация (было отдельно, но теперь в вкладке) */}
        {activeTab === 'moderation' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Заявки на модерацию</h2>
            <div className="space-y-4">
              {products.filter(p => p.status === 'PENDING').map((product) => (
                <div key={product.id} className="border rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{product.title}</h3>
                      <p className="text-sm text-gray-500">{product.description || 'Без описания'}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">{product.price} ₽</p>
                      <p className="text-xs text-gray-400">Продавец: {product.user?.email || 'Unknown'}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem('token');
                          const res = await fetch('http://localhost:5000/graphql', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                              query: `mutation ApproveProduct($id: ID!) { approveProduct(id: $id) }`,
                              variables: { id: product.id }
                            })
                          });
                          const json = await res.json();
                          if (!json.errors) { fetchProducts(); }
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm font-bold min-h-[44px]"
                      >
                        ✅ Одобрить
                      </button>
                      <button
                        onClick={() => setModal({ open: true, type: 'reject', data: product })}
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
              {products.filter(p => p.status === 'PENDING').length === 0 && (
                <p className="text-gray-400 text-center py-8">Нет заявок на модерацию</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно для категории */}
      <Modal isOpen={modal.open && modal.type === 'category'} onClose={() => setModal({ open: false, type: '', data: null })} title="Создать категорию">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const name = (form.elements.namedItem('name') as HTMLInputElement).value;
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                query: `mutation CreateCategory($name: String!) { createCategory(name: $name) { id name } }`,
                variables: { name }
              })
            });
            const json = await res.json();
            if (json.errors) throw new Error(json.errors[0].message);
            fetchCategories();
            setModal({ open: false, type: '', data: null });
          } catch (e: any) { alert('Ошибка: ' + e.message); }
        }}>
          <input
            name="name"
            placeholder="Название категории"
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100 mb-4"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">
            Создать
          </button>
        </form>
      </Modal>

      {/* Модальное окно для отклонения */}
      <Modal isOpen={modal.open && modal.type === 'reject'} onClose={() => setModal({ open: false, type: '', data: null })} title="Причина отказа">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const reason = (form.elements.namedItem('reason') as HTMLTextAreaElement).value;
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                query: `mutation RejectProduct($id: ID!, $reason: String!) { rejectProduct(id: $id, reason: $reason) }`,
                variables: { id: modal.data.id, reason }
              })
            });
            const json = await res.json();
            if (json.errors) throw new Error(json.errors[0].message);
            fetchProducts();
            setModal({ open: false, type: '', data: null });
          } catch (e: any) { alert('Ошибка: ' + e.message); }
        }}>
          <textarea
            name="reason"
            placeholder="Причина отклонения..."
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500/20 border border-gray-100 h-24 resize-none mb-4"
            required
          />
          <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700">
            Отклонить
          </button>
        </form>
      </Modal>
    </div>
  );
}