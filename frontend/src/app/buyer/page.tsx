'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart, Truck, CreditCard, History, LogOut,
  Plus, Minus, Trash2, User, Package, CheckCircle,
  Clock, MapPin, Home
} from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';
import { getUser, clearAuth } from '@/lib/auth';
import { API_URL, API_BASE } from '@/lib/api';

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
  const [shippingDays, setShippingDays] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank_card' | 'sbp'>('bank_card');

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      } catch (e) {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  };

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(userData);
    loadCart();
    fetchOrders();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (activeTab === 'cart') {
      loadCart();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCart();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setShippingPrice(0);
      setShippingDays(0);
      return;
    }

    const totalWeight = cart.reduce((sum, item) => sum + ((item.weightGrams || 400) * item.quantity), 0) / 1000;

    const calculateDelivery = async () => {
      setDeliveryLoading(true);
      try {
        const res = await fetch(`${API_BASE}/delivery/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            city,
            weight: totalWeight,
            service: deliveryMethod,
          }),
        });
        const data = await res.json();
        if (data.price !== undefined) {
          setShippingPrice(data.price);
          setShippingDays(data.days);
        } else {
          let price = (deliveryMethod === 'cdek' ? 350 : 400) * (city === 'Москва' || city === 'Санкт-Петербург' ? 1 : 1.5);
          if (totalWeight > 5) price *= 1.5;
          const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
          if (total > 5000) price = 0;
          setShippingPrice(Math.round(price));
          setShippingDays(3);
        }
      } catch (error) {
        console.error('Ошибка расчёта доставки:', error);
        let price = (deliveryMethod === 'cdek' ? 350 : 400) * (city === 'Москва' || city === 'Санкт-Петербург' ? 1 : 1.5);
        if (totalWeight > 5) price *= 1.5;
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (total > 5000) price = 0;
        setShippingPrice(Math.round(price));
        setShippingDays(3);
      } finally {
        setDeliveryLoading(false);
      }
    };

    const timer = setTimeout(calculateDelivery, 500);
    return () => clearTimeout(timer);
  }, [city, deliveryMethod, cart]);

  const fetchOrders = async () => {
    try {
      const userId = user?.id || localStorage.getItem('userId');
      if (!userId) return;

      const query = `query GetOrders($userId: String!) {
        orders(userId: $userId) {
          id
          deliveryMethod
          deliveryPrice
          totalAmount
          status
          createdAt
          items {
            id
            quantity
            price
            product { title }
          }
        }
      }`;
      const variables = { userId };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, variables })
      });

      const json = await res.json();
      if (json.data?.orders) setOrders(json.data.orders);
    } catch (e) {
      console.error('❌ Ошибка fetchOrders:', e);
    }
  };

  const removeFromCart = (id: string | number) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    const newCart = cart.map(item => item.id === id ? { ...item, quantity } : item);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePayment = async () => {
    if (cart.length === 0) {
      alert('Корзина пуста');
      return;
    }
    setPaymentLoading(true);

    try {
      const createOrderQuery = `mutation CreateOrder($deliveryMethod: String!, $items: [OrderItemInput!]!) {
        createOrder(deliveryMethod: $deliveryMethod, items: $items) {
          id
          totalAmount
          status
          deliveryPrice
          createdAt
        }
      }`;
      const createOrderVariables = {
        deliveryMethod,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      const orderRes = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: createOrderQuery, variables: createOrderVariables })
      });
      const orderJson = await orderRes.json();
      if (orderJson.errors) throw new Error(orderJson.errors[0].message);
      const order = orderJson.data.createOrder;

      const payRes = await fetch(`${API_BASE}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: order.totalAmount,
          description: `Оплата заказа ${order.id}`,
          orderId: order.id,
          paymentMethod: paymentMethod,
          returnUrl: `http://localhost:3000/payment-success?orderId=${order.id}`,
        })
      });
      const payment = await payRes.json();
      if (!payment.confirmationUrl) throw new Error('Не удалось получить ссылку на оплату');

      window.location.href = payment.confirmationUrl;
    } catch (e: any) {
      console.error('❌ Ошибка оплаты:', e);
      alert('❌ Ошибка оплаты: ' + e.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('userUpdated'));
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
                      <span>{deliveryLoading ? 'Расчёт...' : `Доставка: ${shippingPrice} ₽, срок: ${shippingDays} дня`}</span>
                    </div>
                  </div>

                  <div className="border rounded-xl p-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-3">Способ оплаты</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_card"
                          checked={paymentMethod === 'bank_card'}
                          onChange={() => setPaymentMethod('bank_card')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label className="text-sm font-medium text-gray-700">💳 Банковская карта</label>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="sbp"
                          checked={paymentMethod === 'sbp'}
                          onChange={() => setPaymentMethod('sbp')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label className="text-sm font-medium text-gray-700">📱 СБП</label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#ff8012]/5 rounded-xl p-4 border border-[#ff8012]/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Итого:</span>
                      <span className="text-2xl font-black text-[#ff8012]">{totalWithShipping} ₽</span>
                    </div>
                    <button
                      onClick={handlePayment}
                      disabled={paymentLoading || cart.length === 0 || deliveryLoading}
                      className="w-full bg-[#ff8012] hover:bg-[#e06a00] text-white font-bold py-3 rounded-xl mt-3 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><CreditCard size={18} /> Оплатить заказ</>
                      )}
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