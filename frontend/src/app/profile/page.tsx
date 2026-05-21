'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import * as amplitude from '@amplitude/analytics-browser';
import Script from 'next/script'; // Импортируем безопасный компонент для скриптов

// Замените на ваш реальный ID счетчика Яндекс.Метрики
const YM_COUNTER_ID = 12345678; 

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isSellerMode, setIsSellerMode] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Все товары для панели продавца
  
  // Параметры доставки СДЭК и Boxberry
  const [city, setCity] = useState('Москва');
  const [deliveryProvider, setDeliveryProvider] = useState<'cdek' | 'boxberry'>('cdek');
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  // Параметры оплаты ЮKassa и СБП одной кнопкой
  const [paymentMethod, setPaymentMethod] = useState<'yookassa' | 'sbp'>('yookassa');
  const [isPaying, setIsPaying] = useState(false);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();

  // Состояния для формы товара
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodCategory, setProdCategory] = useState('Смартфоны');
  const [prodImage, setProdImage] = useState(''); // URL Изображения

  // Инициализация аналитики Amplitude
  useEffect(() => {
    amplitude.init('YOUR_AMPLITUDE_API_KEY', { defaultTracking: true });
  }, []);

  // Индивидуальная инициализация режима продавца/покупателя на основе ID зашедшего пользователя
  useEffect(() => {
    const token = Cookies.get('token');
    const localUser = localStorage.getItem('user');
    
    if (!token || !localUser) {
      router.push('/auth');
    } else {
      const parsedUser = JSON.parse(localUser);
      setUser(parsedUser);
      
      // Проверяем сохраненный режим именно для этого уникального userId
      const savedMode = localStorage.getItem(`seller_mode_user_${parsedUser.id}`);
      setIsSellerMode(savedMode === 'true'); // Если сохранено 'true' — включаем режим продавца

      setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
      fetchOrdersHistory(parsedUser.id);
      
      // ИСПРАВЛЕННЫЙ ВЫЗОВ: Передаем id текущего пользователя для загрузки его личного каталога
      fetchAllProducts(parsedUser.id);
    }
  }, [router]);

  // Метод трекинга событий в обе системы аналитики
  const trackEvent = (eventName: string, params?: object) => {
    amplitude.track(eventName, params);
    if ((window as any).ym) {
      (window as any).ym(YM_COUNTER_ID, 'reachGoal', eventName, params);
    }
  };

  // Функция запроса к бэкенду для расчета доставки
  const calculateShipping = async () => {
    if (!city.trim()) return;
    setLoadingDelivery(true);
    try {
      const response = await fetch('http://localhost:4000/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, provider: deliveryProvider, items: cart }),
      });
      const data = await response.json();
      if (data && typeof data.price === 'number') {
        setShippingPrice(data.price);
        trackEvent('shipping_calculated', { provider: deliveryProvider, city, price: data.price });
      }
    } catch (err) {
      console.error('Ошибка при обращении к серверу расчета доставки:', err);
    } finally {
      setLoadingDelivery(false);
    }
  };

  // Пересчитываем доставку при изменении города, службы или состава корзины
  useEffect(() => {
    if (cart.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        calculateShipping();
      }, 600); // Задержка (debounce), чтобы не спамить бэкенд при вводе каждой буквы
      return () => clearTimeout(delayDebounceFn);
    }
  }, [city, deliveryProvider, cart]);

  // Обработчик единой кнопки оплаты ЮKassa / СБП
  const handlePayment = async () => {
    setIsPaying(true);
    const finalAmount = calculateTotal() + (shippingPrice || 0);
    trackEvent('payment_initiated', { method: paymentMethod, total_sum: finalAmount });

    try {
      const response = await fetch('http://localhost:4000/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: finalAmount,
          paymentMethod, // 'yookassa' or 'sbp'
          delivery: { provider: deliveryProvider, city, price: shippingPrice },
          items: cart
        }),
      });

      const data = await response.json();

      if (response.ok && data.confirmationUrl) {
        trackEvent('payment_redirect_success', { method: paymentMethod });
        window.location.href = data.confirmationUrl; // Переход на платежную страницу шлюза
      } else {
        alert('Не удалось создать платежную сессию на сервере');
      }
    } catch (err) {
      console.error('Ошибка оплаты:', err);
      alert('Произошла непредвиденная ошибка во время создания платежа');
    } finally {
      setIsPaying(false);
    }
  };

  // ШАГ 1: Измененная функция загрузки товаров — принимает sellerId и запрашивает только товары текущего аккаунта
  const fetchAllProducts = async (userId: number) => {
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($sellerId: Int!) { 
            searchProducts(query: "", sellerId: $sellerId) { 
              id name price stock category description image 
            } 
          }`,
          variables: { sellerId: userId }
        })
      });
      const result = await response.json();
      setAllProducts(result.data?.searchProducts || []);
    } catch (err) {
      console.error('Ошибка загрузки каталога продавца:', err);
    }
  };

  const fetchOrdersHistory = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/orders/history/${userId}`);
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingOrders(false); }
  };

  // Создание или обновление товара
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = editingProductId !== null;
    const url = isEditing 
      ? `http://localhost:4000/api/products/${editingProductId}` 
      : 'http://localhost:4000/api/products/create';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          price: Number(prodPrice),
          stock: Number(prodStock),
          category: prodCategory,
          image: prodImage || 'https://unsplash.com',
          sellerId: user.id // Передаем sellerId, чтобы товар привязался к текущему пользователю в БД
        })
      });

      if (res.ok) {
        alert(isEditing ? 'Товар успешно обновлен!' : 'Товар успешно добавлен!');
        setEditingProductId(null);
        setProdName(''); setProdDesc(''); setProdPrice(''); setProdStock(''); setProdImage('');
        fetchAllProducts(user.id); // Обновляем личный каталог продавца после сохранения
      }
    } catch (err) { alert('Ошибка сохранения'); }
  };

  // Удаление товара
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Товар удален');
        fetchAllProducts(user.id); // Обновляем личный каталог продавца после удаления
      }
    } catch (err) { alert('Ошибка при удалении'); }
  };

  // Подготовка формы к редактированию
  const startEdit = (product: any) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdDesc(product.description || '');
    setProdPrice(product.price.toString());
    setProdStock(product.stock.toString());
    setProdCategory(product.category);
    setProdImage(product.image || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!user) return <p style={{ padding: '40px', textAlign: 'center' }}>Проверка...</p>;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', fontFamily: 'sans-serif' }}>
      
      {/* ЛЕВАЯ КОЛОНКА */}
      <div>
        {/* Профиль */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e1e1e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Личный кабинет ({isSellerMode ? 'Продавец' : 'Покупатель'})</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => { 
                  const nextMode = !isSellerMode;
                  setIsSellerMode(nextMode); 
                  
                  if (user?.id) {
                    localStorage.setItem(`seller_mode_user_${user.id}`, String(nextMode));
                  }
                  
                  trackEvent('toggle_user_mode', { is_seller: nextMode }); 
                }} 
                style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isSellerMode ? '🛒 Режим покупателя' : '💼 Режим продавца'}
              </button>
              <button onClick={() => { Cookies.remove('token'); localStorage.removeItem('user'); router.push('/auth'); }} style={{ padding: '8px 16px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Выйти</button>
            </div>
          </div>
        </div>

        {!isSellerMode ? (
          <>
            {/* ИНТЕРФЕЙС ПОКУПАТЕЛЯ */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e1e1e1' }}>
              <h3>Ваша корзина</h3>
              {cart.length === 0 ? <p>Корзина пуста.</p> : cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div>{item.name} ({item.quantity} шт.)</div>
                  <strong>{(item.price * item.quantity).toLocaleString()} ₽</strong>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e1e1e1' }}>
              <h3>История заказов</h3>
              {orders.map(o => (
                <div key={o.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>Заказ #{o.id} — {o.totalPrice} ₽ ({o.status === 'paid' ? 'Оплачен' : 'Ожидает'})</div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 💼 ИНТЕРФЕЙС ПРОДАВЦА */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e1e1e1' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#0070f3' }}>
                {editingProductId ? '✏️ Редактирование товара' : '➕ Добавление нового предмета в каталог'}
              </h3>
              
              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} required placeholder="Название товара" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="Смартфоны">Смартфоны</option>
                  <option value="Ноутбуки">Ноутбуки</option>
                  <option value="Аксессуары">Аксессуары</option>
                </select>
                <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Описание" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px' }} />
                <input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required placeholder="Цена" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} required placeholder="Количество на складе" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <input type="text" value={prodImage} onChange={(e) => setProdImage(e.target.value)} placeholder="URL изображения" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                <button type="submit" style={{ padding: '12px', backgroundColor: '#2ec4b6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingProductId ? 'Сохранить изменения' : 'Создать товар'}
                </button>
                {editingProductId && (
                  <button type="button" onClick={() => { setEditingProductId(null); setProdName(''); setProdDesc(''); setProdPrice(''); setProdStock(''); setProdImage(''); }} style={{ padding: '8px', backgroundColor: '#aaa', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
                )}
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e1e1e1' }}>
              <h3>Ваш каталог товаров ({allProducts.length})</h3>
              {allProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div><strong>{p.name}</strong> — {p.price} ₽ (Склад: {p.stock} шт)</div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => startEdit(p)} style={{ padding: '4px 8px', backgroundColor: '#f0ad4e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Редактировать</button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: '4px 8px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА (ОФОРМЛЕНИЕ ЗАКАЗА) */}
      <div>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e1e1e1', position: 'sticky', top: '40px' }}>
          <h3 style={{ marginTop: 0 }}>Оформление заказа</h3>
          
          {/* Расчет служб доставки */}
          <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Город доставки:</label>
            <input 
              type="text" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
              placeholder="Например, Самара"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '12px' }} 
            />

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Служба доставки:</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <button 
                type="button"
                onClick={() => setDeliveryProvider('cdek')} 
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', backgroundColor: deliveryProvider === 'cdek' ? '#e6f7ff' : 'white', borderColor: deliveryProvider === 'cdek' ? '#1890ff' : '#ccc', fontWeight: deliveryProvider === 'cdek' ? 'bold' : 'normal' }}
              >
                📦 СДЭК
              </button>
              <button 
                type="button"
                onClick={() => setDeliveryProvider('boxberry')} 
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', backgroundColor: deliveryProvider === 'boxberry' ? '#f6ffed' : 'white', borderColor: deliveryProvider === 'boxberry' ? '#52c41a' : '#ccc', fontWeight: deliveryProvider === 'boxberry' ? 'bold' : 'normal' }}
              >
                📦 Boxberry
              </button>
            </div>

            <div style={{ fontSize: '14px', color: '#555', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '6px' }}>
              Стоимость доставки: <strong>{loadingDelivery ? 'считаем...' : shippingPrice !== null ? `${shippingPrice} ₽` : 'укажите город'}</strong>
            </div>
          </div>

          {/* Выбор метода оплаты */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Способ оплаты:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: paymentMethod === 'yookassa' ? '#f0f7ff' : 'transparent', borderColor: paymentMethod === 'yookassa' ? '#0070f3' : '#eee' }}>
                <input type="radio" name="paymentMethod" value="yookassa" checked={paymentMethod === 'yookassa'} onChange={() => setPaymentMethod('yookassa')} style={{ cursor: 'pointer' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>ЮKassa</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Банковские карты, Мир Pay, электронные деньги</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: paymentMethod === 'sbp' ? '#f6ffed' : 'transparent', borderColor: paymentMethod === 'sbp' ? '#52c41a' : '#eee' }}>
                <input type="radio" name="paymentMethod" value="sbp" checked={paymentMethod === 'sbp'} onChange={() => setPaymentMethod('sbp')} style={{ cursor: 'pointer' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>СБП (Система быстрых платежей)</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Мгновенная оплата по QR-коду или в приложении банка</div>
                </div>
              </label>
            </div>
          </div>

          {/* Итоги */}
          <div style={{ marginBottom: '20px', fontSize: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Товары:</span>
              <span>{calculateTotal().toLocaleString()} ₽</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>Доставка ({deliveryProvider.toUpperCase()}):</span>
              <span>{shippingPrice !== null ? `${shippingPrice} ₽` : '0 ₽'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', paddingTop: '12px', borderTop: '2px solid #eee' }}>
              <span>Итого к оплате:</span>
              <span>{(calculateTotal() + (shippingPrice || 0)).toLocaleString()} ₽</span>
            </div>
          </div>

          {/* Единая кнопка оплаты */}
          <button 
            type="button"
            onClick={handlePayment}
            disabled={cart.length === 0 || isPaying || loadingDelivery}
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: paymentMethod === 'sbp' ? '#52c41a' : '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              transition: 'background-color 0.2s',
              opacity: (cart.length === 0 || isPaying || loadingDelivery) ? 0.5 : 1 
            }}
          >
            {isPaying ? 'Формирование заказа...' : `Оплатить через ${paymentMethod === 'yookassa' ? 'ЮKassa' : 'СБП'}`}
          </button>
        </div>
      </div>

      {/* 1. Загружаем официальный скрипт Метрики как внешний ресурс */}
      <Script 
        src="https://yandex.ru" 
        strategy="afterInteractive" 
      />

      {/* 2. Инициализируем счетчик только после готовности глобальной переменной */}
      <Script id="yandex-metrika-init" strategy="afterInteractive">
        {`
          window.ym = window.ym || function() {
            (window.ym.a = window.ym.a || []).push(arguments)
          };
          window.ym.l = 1 * new Date();

          ym(${YM_COUNTER_ID}, "init", {
               clickmap:true,
               trackLinks:true,
               accurateTrackBounce:true,
               webvisor:true
          });
        `}
      </Script>

    </div>
  );
}

