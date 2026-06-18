'use client';

import { useState, useEffect } from 'react';
import { CartItem } from './types';

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

  // Динамический расчет стоимости доставки и веса на основе СУБД бэкенда
  useEffect(() => {
    if (!city || cart.length === 0) {
      setShippingPrice(0);
      setTotalWeightKg(0);
      return;
    }

    const fetchShippingCost = async () => {
      setLoadingShipping(true);
      try {
        const response = await fetch('http://localhost:4000/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city,
            provider,
            items: cart.map(item => ({ 
              id: String(item.id), 
              quantity: item.quantity 
            }))
          })
        });

        if (!response.ok) throw new Error('Ошибка расчета доставки');
        const data = await response.json();
        
        setShippingPrice(data.price || 0);

        const weightGrams = cart.reduce((sum, item) => sum + ((item.weightGrams || 400) * item.quantity), 0);
        setTotalWeightKg(weightGrams / 1000);

      } catch (err) {
        console.error('Ошибка логистики:', err);
        setShippingPrice(350); 
        setTotalWeightKg(cart.length * 0.4);
      } finally {
        setLoadingShipping(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchShippingCost();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [city, provider, cart]);

  const handleRemove = (id: string) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };
  // Оформление заказа и отправка данных на платежный шлюз ЮKassa
  const handlePaymentSubmit = async () => {
    if (cart.length === 0) return;
    setLoadingPayment(true);

    const parsedUserId = user && user.id ? parseInt(String(user.id), 10) : 1;
    const finalUserId = isNaN(parsedUserId) ? 1 : parsedUserId;

    try {
      // Шаг А: Сначала сохраняем реальный заказ в PostgreSQL на бэкенде
      const orderResponse = await fetch('http://localhost:4000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          totalPrice: calculateFinalTotal(),
          deliveryProvider: provider,
          deliveryCity: city,
          deliveryPrice: shippingPrice,
          items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
        })
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.message || 'Ошибка СУБД при сохранении заказа');
      }

      const orderData = await orderResponse.json();

      // Шаг Б: После успешного создания заказа отправляем запрос в платежный шлюз
      const paymentResponse = await fetch('http://localhost:4000/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          amount: calculateFinalTotal(),
          paymentMethod: 'bank_card',
          orderId: orderData.orderId 
        })
      });

      if (!paymentResponse.ok) throw new Error('Не удалось инициировать платеж');
      const data = await paymentResponse.json();

      if (data.success && data.confirmationUrl) {
        // ✅ ШАГ 3 (ИСПРАВЛЕНО): Записываем купленные товары в профиль пользователя для разблокировки отзывов
        const currentPurchased = JSON.parse(localStorage.getItem(`purchased_items_${finalUserId}`) || '[]');
        cart.forEach(item => {
          if (!currentPurchased.includes(String(item.id))) {
            currentPurchased.push(String(item.id));
          }
        });
        localStorage.setItem(`purchased_items_${finalUserId}`, JSON.stringify(currentPurchased));

        // Очищаем корзину на фронтенде перед редиректом
        setCart([]);
        localStorage.removeItem('cart');
        
        // Перенаправление на тестовую страницу оплаты ЮKassa
        window.location.href = data.confirmationUrl; 
      } else {
        throw new Error(data.message || 'Шлюз не вернул платежную ссылку');
      }

    } catch (err: any) {
      alert(`❌ Ошибка оформления: ${err.message}`);
    } finally {
      setLoadingPayment(false);
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-sans w-full max-w-5xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        
        {/* БЛОК: Корзина */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/40">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex justify-between items-center">
            <span>Ваша корзина товаров</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">{cart.length}</span>
          </h3>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center py-10 text-sm font-medium">В вашей корзине пока пусто.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 border rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={item.image || 'https://unsplash.com'} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.quantity} шт. &middot; {item.price.toLocaleString()} ₽</p>
                      {item.weightGrams && <p className="text-[10px] text-slate-400 font-medium">Вес ед.: {item.weightGrams} г</p>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(String(item.id))}
                    className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* БЛОК: Доставка */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/40">
          <h3 className="text-lg font-black text-slate-800 mb-4">Оформление доставки</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Город получения</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-3 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Логистическая служба</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value as any)} 
                className="w-full border border-slate-200 bg-slate-50/50 px-4 py-3 rounded-2xl text-sm font-bold bg-white outline-none"
              >
                <option value="cdek">СДЭК Logistics</option>
                <option value="boxberry">Boxberry курьер</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* БЛОК: Итоговая смета */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4 sticky top-24">
        <h3 className="text-lg font-black text-slate-800">Финансовый итог</h3>
        <div className="space-y-2 text-xs text-slate-500 border-b pb-3">
          <div className="flex justify-between">
            <span>Стоимость товаров:</span>
            <span className="font-bold text-slate-700">{calculateItemsTotal().toLocaleString()} ₽</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Служба доставки:</span>
            <span className="font-bold text-slate-700">
              {loadingShipping ? <span className="text-xs text-blue-500 animate-pulse font-bold">расчет...</span> : `${shippingPrice} ₽`}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-50">
            <span>Общий вес посылки:</span>
            <span className="font-bold text-slate-600">{totalWeightKg.toFixed(2)} кг</span>
          </div>
        </div>
        <div className="flex justify-between items-baseline pt-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Сумма заказа:</span>
          <span className="text-3xl font-black text-blue-600">{calculateFinalTotal().toLocaleString()} ₽</span>
        </div>
        <button 
          onClick={handlePaymentSubmit} 
          disabled={cart.length === 0 || loadingPayment || loadingShipping} 
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-2xl text-sm shadow-lg uppercase"
        >
          {loadingPayment ? 'Формирование чека...' : 'Перейти к безопасной оплате'}
        </button>
      </div>
    </div>
  );
}
