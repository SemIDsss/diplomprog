'use client';

import { useState, useEffect } from 'react';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  weightGrams?: number;
}

interface BuyerProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  user: any;
}

export function BuyerWorkspace({ cart, setCart, user }: BuyerProps) {
  const [city, setCity] = useState('Москва');
  const [provider, setProvider] = useState<'cdek' | 'boxberry'>('cdek');
  const [shippingPrice, setShippingPrice] = useState<number>(0);
  const [loadingShipping, setLoadingShipping] = useState<boolean>(false);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);
  const [totalWeightKg, setTotalWeightKg] = useState<number>(0);

  const calculateItemsTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculateFinalTotal = () => calculateItemsTotal() + shippingPrice;

  useEffect(() => {
    if (!city || cart.length === 0) {
      setShippingPrice(0);
      setTotalWeightKg(0);
      return;
    }

    const fetchShippingCost = async () => {
      setLoadingShipping(true);
      try {
        // Имитация расчета доставки
        const basePrice = provider === 'cdek' ? 350 : 400;
        const cityMultiplier = city === 'Москва' || city === 'Санкт-Петербург' ? 1 : 1.5;
        const weight = cart.reduce((sum, item) => sum + ((item.weightGrams || 400) * item.quantity), 0) / 1000;
        
        setShippingPrice(Math.round(basePrice * cityMultiplier));
        setTotalWeightKg(weight);
      } catch (err) {
        console.error('Ошибка логистики:', err);
        setShippingPrice(350);
        setTotalWeightKg(cart.length * 0.4);
      } finally {
        setLoadingShipping(false);
      }
    };

    const delayDebounce = setTimeout(fetchShippingCost, 600);
    return () => clearTimeout(delayDebounce);
  }, [city, provider, cart]);

  const handleRemove = (id: string | number) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handlePaymentSubmit = async () => {
    if (cart.length === 0) return;
    setLoadingPayment(true);

    try {
      // Создание заказа
      const orderResponse = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: `
            mutation CreateOrder($deliveryMethod: String!) {
              createOrder(deliveryMethod: $deliveryMethod) {
                id
                totalAmount
                status
              }
            }
          `,
          variables: { deliveryMethod: provider }
        })
      });

      const orderData = await orderResponse.json();
      if (orderData.errors) throw new Error(orderData.errors[0]?.message);

      const orderId = orderData.data.createOrder.id;
      const totalAmount = orderData.data.createOrder.totalAmount;

      // Инициация платежа
      const paymentResponse = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: `
            mutation InitiatePayment($orderId: String!, $method: String!) {
              initiatePayment(orderId: $orderId, method: $method) {
                paymentUrl
                orderId
              }
            }
          `,
          variables: { orderId, method: 'YUKASSA' }
        })
      });

      const paymentData = await paymentResponse.json();
      if (paymentData.errors) throw new Error(paymentData.errors[0]?.message);

      if (paymentData.data.initiatePayment.paymentUrl) {
        setCart([]);
        localStorage.removeItem('cart');
        window.location.href = paymentData.data.initiatePayment.paymentUrl;
      }
    } catch (err: any) {
      alert(`❌ Ошибка: ${err.message}`);
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Левая колонка - Корзина и доставка */}
      <div className="flex-1 space-y-6">
        {/* Корзина */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm">
          <h3 className="text-lg md:text-xl font-black text-gray-800 mb-4 flex justify-between items-center">
            <span>Корзина</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">{cart.length}</span>
          </h3>

          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-8 md:py-12 text-sm">Корзина пуста</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="w-12 h-12 bg-gray-50 border rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={item.image || 'https://via.placeholder.com/48'} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400">{item.quantity} шт. · {item.price.toLocaleString()} ₽</p>
                  </div>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors min-h-[36px]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Доставка */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm">
          <h3 className="text-lg md:text-xl font-black text-gray-800 mb-4">Доставка</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Город</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="w-full border bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Служба</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value as any)} 
                className="w-full border bg-gray-50 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="cdek">СДЭК</option>
                <option value="boxberry">Boxberry</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Правая колонка - Итог */}
      <div className="lg:w-80 xl:w-96">
        <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm sticky top-20 space-y-4">
          <h3 className="text-lg md:text-xl font-black text-gray-800">Итог</h3>
          
          <div className="space-y-2 text-sm text-gray-500 border-b pb-3">
            <div className="flex justify-between">
              <span>Товары:</span>
              <span className="font-bold text-gray-700">{calculateItemsTotal().toLocaleString()} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>Доставка:</span>
              <span className="font-bold text-gray-700">
                {loadingShipping ? '...' : `${shippingPrice} ₽`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-50">
              <span>Вес:</span>
              <span className="font-bold text-gray-600">{totalWeightKg.toFixed(1)} кг</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-2">
            <span className="text-sm font-bold text-gray-400 uppercase">Итого:</span>
            <span className="text-2xl md:text-3xl font-black text-blue-600">{calculateFinalTotal().toLocaleString()} ₽</span>
          </div>

          <button 
            onClick={handlePaymentSubmit} 
            disabled={cart.length === 0 || loadingPayment || loadingShipping} 
            className="w-full py-3.5 md:py-4 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
          >
            {loadingPayment ? 'Обработка...' : 'Оплатить'}
          </button>
        </div>
      </div>
    </div>
  );
}