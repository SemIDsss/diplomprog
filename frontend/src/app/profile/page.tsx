'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import * as amplitude from '@amplitude/analytics-browser';
import Script from 'next/script'; // Импортируем безопасный компонент для скриптов

// Замените на ваш реальный ID счетчика Яндекс.Метрики
const YM_COUNTER_ID = 12345678; 

// Базовый URL бэкенда (динамический: Vercel использует переменную, иначе localhost)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  // Вспомогательная функция для расчета стоимости корзины
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  // Получение истории заказов
  const fetchOrdersHistory = async (userId: number) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки истории заказов:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Загрузка каталога товаров (для режима продавца)
  const fetchAllProducts = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/products?sellerId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAllProducts(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке каталога товаров:', err);
    }
  };

  // Функция запроса к бэкенду для расчета доставки
  const calculateShipping = async () => {
    if (!city.trim() || cart.length === 0) return;
    setLoadingDelivery(true);
    try {
      const response = await fetch(`${API_BASE}/api/shipping/calculate`, {
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

  // Обработчик переключения режимов Продавец/Покупатель
  const handleModeToggle = (checked: boolean) => {
    setIsSellerMode(checked);
    if (user?.id) {
      localStorage.setItem(`seller_mode_user_${user.id}`, String(checked));
      trackEvent('mode_switched', { mode: checked ? 'seller' : 'buyer' });
    }
  };

  // Создание или обновление товара в панели продавца
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) return alert('Заполните обязательные поля');

    const productData = {
      name: prodName,
      description: prodDesc,
      price: parseFloat(prodPrice),
      stock: parseInt(prodStock) || 0,
      category: prodCategory,
      image: prodImage,
      sellerId: user.id
    };

    try {
      const url = editingProductId 
        ? `${API_BASE}/api/products/${editingProductId}`
        : `${API_BASE}/api/products`;
      
      const response = await fetch(url, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        trackEvent(editingProductId ? 'product_updated' : 'product_created', { name: prodName });
        // Сбрасываем форму и обновляем список
        setEditingProductId(null);
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setProdStock('');
        setProdImage('');
        fetchAllProducts(user.id);
      }
    } catch (err) {
      console.error('Ошибка сохранения товара:', err);
    }
  };

  // Удаление товара продавцом
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        trackEvent('product_deleted', { productId });
        fetchAllProducts(user.id);
      }
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
    }
  };

  // Перевод формы в режим редактирования существующего товара
  const handleEditClick = (product: any) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdDesc(product.description || '');
    setProdPrice(String(product.price));
    setProdStock(String(product.stock));
    setProdCategory(product.category || 'Смартфоны');
    setProdImage(product.image || '');
  };

  // Обработчик единой кнопки оплаты ЮKassa / СБП
  const handlePayment = async () => {
    setIsPaying(true);
    const finalAmount = calculateTotal() + (shippingPrice || 0);
    trackEvent('payment_initiated', { method: paymentMethod, total_sum: finalAmount });

    try {
      // ИСПРАВЛЕННЫЙ ЭНДПОИНТ: Изменен с /shipping/calculate на /payment/create для совершения платежей
      const response = await fetch(`${API_BASE}/api/payment/create`, {
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
        alert(data.message || 'Не удалось создать платежную сессию на сервере');
      }
    } catch (err) {
      console.error('Ошибка оплаты:', err);
      alert('Произошла непредвиденная ошибка во время создания платежа');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Подключение Яндекс.Метрики */}
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          window, document, "script", "https://yandex.ru", "ym");

          ym(${YM_COUNTER_ID}, "init", {
               clickmap:true,
               trackLinks:true,
               accurateTrackBounce:true,
               webvisor:true
          });
        `}
      </Script>

      <h2>Личный кабинет {user ? `— ${user.name || user.email}` : ''}</h2>
      
      {/* Переключатель режима */}
      <div style={{ margin: '20px 0', background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={isSellerMode} 
            onChange={(e) => handleModeToggle(e.target.checked)} 
            style={{ marginRight: '10px' }}
          />
          Режим продавца (Управление каталогом)
        </label>
      </div>

      {!isSellerMode ? (
        /* ================= РЕЖИМ ПОКУПАТЕЛЯ ================= */
        <div>
          <h3>Оформление заказа и доставка</h3>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <input 
              type="text" 
              placeholder="Город доставки" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
            />
            <select value={deliveryProvider} onChange={(e) => setDeliveryProvider(e.target.value as any)}>
              <option value="cdek">СДЭК</option>
              <option value="boxberry">Boxberry</option>
            </select>
            <button onClick={calculateShipping} disabled={loadingDelivery}>
              {loadingDelivery ? 'Считаем...' : 'Рассчитать доставку'}
            </button>
          </div>

          {shippingPrice !== null && (
            <p>Стоимость доставки: <strong>{shippingPrice} ₽</strong></p>
          )}

          <div style={{ margin: '20px 0', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
            <h3>Оплата заказа</h3>
            <p>Сумма товаров: {calculateTotal()} ₽</p>
            <p>Итого к оплате: {calculateTotal() + (shippingPrice || 0)} ₽</p>
            
            <div style={{ margin: '10px 0' }}>
              <label style={{ marginRight: '15px' }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="yookassa" 
                  checked={paymentMethod === 'yookassa'} 
                  onChange={() => setPaymentMethod('yookassa')}
                /> ЮKassa (Карты, кошельки)
              </label>
              <label>
                <input 
                  type="radio" 
                  name="payment" 
                  value="sbp" 
                  checked={paymentMethod === 'sbp'} 
                  onChange={() => setPaymentMethod('sbp')}
                /> СБП (Оплата в один клик)
              </label>
            </div>

            <button 
              onClick={handlePayment} 
              disabled={isPaying || cart.length === 0} 
              style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              {isPaying ? 'Перенаправление...' : 'Оплатить заказ'}
            </button>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3>История заказов</h3>
            {loadingOrders ? <p>Загрузка истории...</p> : orders.length === 0 ? <p>У вас еще нет заказов.</p> : (
              <ul>
                {orders.map((o: any) => (
                  <li key={o.id}>Заказ #{o.id} — {o.amount} ₽ ({o.status})</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* ================= РЕЖИМ ПРОДАВЦА ================= */
        <div>
          <h3>Панель управления товарами</h3>
          <form onSubmit={handleSaveProduct} style={{ background: '#fafafa', padding: '15px', borderRadius: '5px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <h4>{editingProductId ? 'Редактировать товар' : 'Добавить новый товар'}</h4>
            <input type="text" placeholder="Название товара *" value={prodName} onChange={e => setProdName(e.target.value)} required />
            <textarea placeholder="Описание товара" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
            <input type="number" placeholder="Цена (₽) *" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required />
            <input type="number" placeholder="Количество на складе" value={prodStock} onChange={e => setProdStock(e.target.value)} />
            <select value={prodCategory} onChange={e => setProdCategory(e.target.value)}>
              <option value="Смартфоны">Смартфоны</option>
              <option value="Ноутбуки">Ноутбуки</option>
              <option value="Аксессуары">Аксессуары</option>
            </select>
            <input type="text" placeholder="Ссылка на URL картинки" value={prodImage} onChange={e => setProdImage(e.target.value)} />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ background: '#00cc66', color: '#white', padding: '7px 15px', border: 'none', cursor: 'pointer' }}>
                {editingProductId ? 'Сохранить изменения' : 'Создать товар'}
              </button>
              {editingProductId && (
                <button type="button" onClick={() => { setEditingProductId(null); setProdName(''); setProdDesc(''); setProdPrice(''); setProdStock(''); setProdImage(''); }} style={{ background: '#aaa', color: '#fff', padding: '7px 15px', border: 'none', cursor: 'pointer' }}>
                  Отмена
                </button>
              )}
            </div>
          </form>

          <h4>Ваш каталог товаров:</h4>
          {allProducts.length === 0 ? <p>Вы еще не добавили ни одного товара.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {allProducts.map((p: any) => (
                <div key={p.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px', background: '#fff' }}>
                  {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', marginBottom: '5px' }} />}
                  <h5>{p.name}</h5>
                  <p>{p.price} ₽ (В наличии: {p.stock})</p>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => handleEditClick(p)} style={{ fontSize: '12px', background: '#ffcc00', border: 'none', padding: '3px 8px', cursor: 'pointer' }}>Редактировать</button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ fontSize: '12px', background: '#ff3333', color: '#fff', border: 'none', padding: '3px 8px', cursor: 'pointer' }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
