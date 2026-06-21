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
      
      // Создание заказа
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

      // ✅ СОБЫТИЕ: создание заказа
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
      

      // Инициация платежа
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-4 text-base">Загрузка...</p>
      </div>
    </div>
  );

  const total = calculateTotal();
  const totalWithShipping = total + shippingPrice;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Шапка профиля */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container-mobile py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Мой профиль</h1>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-base font-medium text-red-500 px-4 py-2 bg-red-50 rounded-xl hover:bg-red-100 transition"
          >
            <LogOut size={20} /> Выйти
          </button>
        </div>
      </div>

      <div className="container-mobile py-4 space-y-4">
        {/* Вкладки */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border">
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 py-3 rounded-xl text-base font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'cart' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <ShoppingCart size={22} /> Корзина
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 rounded-xl text-base font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'orders' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <History size={22} /> Заказы
          </button>
        </div>

        {/* Корзина */}
        {activeTab === 'cart' && (
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
                <ShoppingCart size={56} className="text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-500">Корзина пуста</p>
                <p className="text-base text-gray-400 mt-1">Добавьте товары из каталога</p>
                <Link href="/catalog" className="inline-block mt-4 text-base font-bold text-blue-600 hover:underline">
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={28} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base truncate">{item.name}</h4>
                      <p className="text-sm text-gray-400">{item.price} ₽ × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 hover:bg-gray-200 transition">
                        <Minus size={18} />
                      </button>
                      <span className="w-8 text-center font-bold text-base">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 hover:bg-gray-200 transition">
                        <Plus size={18} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-3">
                  <h3 className="font-bold text-base flex items-center gap-2"><Truck size={22} className="text-blue-600" /> Доставка</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Город"
                        className="w-full bg-gray-50 rounded-xl pl-10 pr-3 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                      />
                    </div>
                    <div className="relative">
                      <Home size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value as 'cdek' | 'boxberry')}
                        className="w-full bg-gray-50 rounded-xl pl-10 pr-3 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                      >
                        <option value="cdek">СДЭК</option>
                        <option value="boxberry">Boxberry</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 px-1">
                    <span>Вес: {totalWeight.toFixed(1)} кг</span>
                    <span>Доставка: {shippingPrice} ₽</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-600">Итого:</span>
                    <span className="text-3xl font-black text-blue-600">{totalWithShipping} ₽</span>
                  </div>
                  <button
                    onClick={handlePayment}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl mt-3 shadow-lg shadow-blue-500/25 hover:shadow-xl transition active:scale-95 text-lg flex items-center justify-center gap-2"
                  >
                    <CreditCard size={22} /> Оплатить заказ
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Заказы */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
                <Package size={56} className="text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-500">Нет заказов</p>
                <p className="text-base text-gray-400 mt-1">Оформите первый заказ</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <ShoppingBag size={22} className="text-blue-600 mt-1" />
                      <div>
                        <p className="font-bold text-base text-gray-800">Заказ #{order.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{new Date(Number(order.createdAt)).toLocaleString('ru-RU')}</p>
                        <p className="text-sm text-gray-400">{order.items?.length || 0} товаров · {order.deliveryMethod}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600 text-lg">{order.totalAmount} ₽</span>
                      <p className={`text-sm font-semibold flex items-center gap-1 justify-end mt-0.5 ${order.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.status === 'APPROVED' ? <><CheckCircle size={18} /> Оплачен</> : <><Clock size={18} /> В обработке</>}
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
  );
}