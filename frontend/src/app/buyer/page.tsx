'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingCart, Truck, CreditCard, History, LogOut, 
  Plus, Minus, Trash2, User, Package, CheckCircle, 
  Clock, ShoppingBag, MapPin, Home 
} from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  weightGrams?: number;
}

export default function BuyerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');

  const [city, setCity] = useState('Москва');
  const [deliveryMethod, setDeliveryMethod] = useState<'cdek' | 'boxberry'>('cdek');
  const [shippingPrice, setShippingPrice] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (e) {
      router.push('/login');
    }
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    fetchOrders();
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (cart.length === 0) {
      setShippingPrice(0);
      setTotalWeight(0);
      return;
    }
    const weight = cart.reduce((sum, item) => sum + ((item.weightGrams || 400) * item.quantity), 0) / 1000;
    setTotalWeight(weight);
    let price = (deliveryMethod === 'cdek' ? 350 : 400) * (city === 'Москва' || city === 'Санкт-Петербург' ? 1 : 1.5);
    if (weight > 5) price *= 1.5;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (total > 5000) price = 0;
    setShippingPrice(Math.round(price));
  }, [city, deliveryMethod, cart]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `query GetOrders($userId: String!) {
            orders(userId: $userId) {
              id deliveryMethod deliveryPrice totalAmount status createdAt
              items { id quantity price product { title } }
            }
          }`,
          variables: { userId }
        })
      });
      const json = await res.json();
      if (json.data?.orders) setOrders(json.data.orders);
    } catch (e) { console.error(e); }
  };

  const removeFromCart = (id: string | number) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    const newCart = cart.map(item => item.id === id ? { ...item, quantity } : item);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    if (cart.length === 0) return alert('Корзина пуста');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `mutation CreateOrder($deliveryMethod: String!) {
            createOrder(deliveryMethod: $deliveryMethod) { id totalAmount status deliveryPrice createdAt }
          }`,
          variables: { deliveryMethod }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      const order = json.data.createOrder;

      sendMetricaEvent('create_order', {
        orderId: order.id,
        totalAmount: order.totalAmount,
        itemsCount: cart.length,
        deliveryMethod
      });
      trackEvent('order_created', {
        orderId: order.id,
        totalAmount: order.totalAmount,
        itemsCount: cart.length,
        deliveryMethod,
        userId: localStorage.getItem('userId')
      });

      const payRes = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `mutation InitiatePayment($orderId: String!, $method: String!) {
            initiatePayment(orderId: $orderId, method: $method) { paymentUrl orderId }
          }`,
          variables: { orderId: order.id, method: 'YUKASSA' }
        })
      });
      const payJson = await payRes.json();
      if (payJson.errors) throw new Error(payJson.errors[0].message);
      const payment = payJson.data.initiatePayment;

      setCart([]);
      localStorage.removeItem('cart');
      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      }
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleLogout = () => {
    ['token', 'user', 'userId', 'cart'].forEach(key => localStorage.removeItem(key));
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#ff8012] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 mt-4 text-base">Загрузка...</p>
      </div>
    </div>
  );

  const total = calculateTotal();
  const totalWithShipping = total + shippingPrice;

  return (
    <div className="min-h-screen bg-gray-100 pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ff8012]/10 rounded-full flex items-center justify-center">
                <User size={24} className="text-[#ff8012]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Мой профиль</h1>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition"
            >
              <LogOut size={18} /> Выйти
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === 'cart' ? 'bg-[#ff8012] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart size={18} className="inline mr-2" /> Корзина
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === 'orders' ? 'bg-[#ff8012] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History size={18} className="inline mr-2" /> Заказы
            </button>
          </div>

          {activeTab === 'cart' && (
            <div className="mt-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500">Корзина пуста</p>
                  <Link href="/catalog" className="text-sm font-bold text-[#ff8012] hover:underline inline-block mt-2">
                    Перейти в каталог
                  </Link>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={24} className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-gray-400">{item.price} ₽ × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center active:scale-95 hover:bg-gray-200 transition">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center active:scale-95 hover:bg-gray-200 transition">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-sm flex items-center gap-2"><Truck size={18} className="text-[#ff8012]" /> Доставка</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Город"
                          className="w-full bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#ff8012] border border-gray-200"
                        />
                      </div>
                      <div className="relative">
                        <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          value={deliveryMethod}
                          onChange={(e) => setDeliveryMethod(e.target.value as 'cdek' | 'boxberry')}
                          className="w-full bg-white rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#ff8012] border border-gray-200"
                        >
                          <option value="cdek">СДЭК</option>
                          <option value="boxberry">Boxberry</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Вес: {totalWeight.toFixed(1)} кг</span>
                      <span>Доставка: {shippingPrice} ₽</span>
                    </div>
                  </div>

                  <div className="bg-[#ff8012]/5 rounded-xl p-4 border border-[#ff8012]/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Итого:</span>
                      <span className="text-2xl font-black text-[#ff8012]">{totalWithShipping} ₽</span>
                    </div>
                    <button
                      onClick={handlePayment}
                      className="w-full bg-[#ff8012] hover:bg-[#e06a00] text-white font-bold py-3 rounded-xl mt-3 transition text-sm disabled:opacity-50"
                      disabled={cart.length === 0}
                    >
                      <CreditCard size={18} className="inline mr-2" /> Оплатить заказ
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500">Нет заказов</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-gray-800">Заказ #{order.id.substring(0, 8)}</p>
                        <p className="text-xs text-gray-400">{new Date(Number(order.createdAt)).toLocaleString('ru-RU')}</p>
                        <p className="text-xs text-gray-400">{order.items?.length || 0} товаров · {order.deliveryMethod}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#ff8012]">{order.totalAmount} ₽</span>
                        <p className={`text-xs font-semibold flex items-center gap-1 justify-end ${order.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {order.status === 'APPROVED' ? <><CheckCircle size={14} /> Оплачен</> : <><Clock size={14} /> В обработке</>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}