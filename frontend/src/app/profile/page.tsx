'use client';

import React, { useState, useEffect } from 'react';

const apiProfile = async (userId: string) => {
  const query = `query GetProfile($userId: String!) { userProfile(userId: $userId) { email role } cart(userId: $userId) { id quantity product { title price } } orders(userId: $userId) { id deliveryMethod createdAt } categories { id name subcategories { id name } } }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userId } })
  });
  return res.json();
};

// ИСПРАВЛЕНО: Два изолированных сетевых метода для строгого соответствия схеме GraphQL бэкенда
const apiRegister = async (email: string, password: string, role: string) => {
  const query = `mutation AuthReg($email: String!, $password: String!, $role: String!) { register(email: $email, password: $password, role: $role) { token user { id email role } } }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { email, password, role } })
  });
  return res.json();
};

const apiLogin = async (email: string, password: string) => {
  const query = `mutation AuthLog($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id email role } } }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { email, password } }) // Роль больше НЕ передается в login!
  });
  return res.json();
};

const apiPayment = async (userId: string, method: string) => {
  const query = `mutation PayOrder($userId: String!, $method: String!) { createPayment(userId: $userId, method: $method) { paymentUrl orderId } }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userId, method } })
  });
  return res.json();
};

const apiDeleteCart = async (id: string) => {
  const query = `mutation DeleteCartItem($id: ID!) { deleteFromCart(id: $id) }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id } })
  });
  return res.json();
};

const apiCreateProduct = async (title: string, description: string, price: number, subcategoryId: string) => {
  const query = `mutation NewProduct($title: String!, $description: String, $price: Float!, $subcategoryId: String!) { createProduct(title: $title, description: $description, price: $price, subcategoryId: $subcategoryId) { id title } }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { title, description, price, subcategoryId } })
  });
  return res.json();
};

const apiPendingProducts = async () => {
  const query = `query GetPending { pendingProducts { id title description price } }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return res.json();
};

const apiApproveProduct = async (id: string) => {
  const query = `mutation Approve($id: ID!) { approveProduct(id: $id) }`;
  const res = await fetch('http://localhost:5000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id } })
  });
  return res.json();
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('USER');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('USER');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSubcat, setProdSubcat] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const savedUid = localStorage.getItem('userId');
    if (savedUid) { setUserId(savedUid); loadData(savedUid); }
  }, []);

  const loadData = async (uid: string) => {
    try {
      setLoading(true);
      const json = await apiProfile(uid);
      if (json.data?.userProfile) {
        setUserEmail(json.data.userProfile.email);
        setUserRole(json.data.userProfile.role);
        if (json.data.userProfile.role === 'ADMIN') {
          const pendJson = await apiPendingProducts();
          setPendingProducts(pendJson.data?.pendingProducts || []);
        }
      }
      setCartItems(json.data?.cart || []);
      setOrders(json.data?.orders || []);
      setDbCategories(json.data?.categories || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const op = isRegisterMode ? 'register' : 'login';
    try {
      // ИСПРАВЛЕНО: Разветвление вызовов в зависимости от режима. В логин больше не прокидывается роль.
      const json = isRegisterMode 
        ? await apiRegister(emailInput, passwordInput, roleInput)
        : await apiLogin(emailInput, passwordInput);
      
      if (json && json.errors && json.errors.length > 0) {
        setErrorMsg(json.errors[0]?.message || 'Неверный логин или пароль');
        return;
      }
      
      const auth = json.data?.[op];
      if (auth && auth.user) {
        localStorage.setItem('userId', auth.user.id);
        setUserId(auth.user.id);
        setUserEmail(auth.user.email);
        setUserRole(auth.user.role);
        loadData(auth.user.id);
      } else {
        setErrorMsg('Неверный адрес электронной почты или пароль');
      }
    } catch (e) { setErrorMsg('Сервер недоступен'); }
  };

  const handlePayment = async (method: 'YUKASSA' | 'SBP') => {
    if (!userId) return;
    try {
      const json = await apiPayment(userId, method);
      if (json.data?.createPayment?.paymentUrl) {
        window.open(String(json.data.createPayment.paymentUrl), '_blank');
        setTimeout(() => loadData(userId), 1000);
      } else { alert('Ошибка шлюза'); }
    } catch (e) { alert('Сетевая ошибка'); }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const json = await apiDeleteCart(id);
      if (json.data?.deleteFromCart && userId) { loadData(userId); }
    } catch (e) { console.error(e); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodPrice || !prodSubcat) { alert('Заполните обязательные поля'); return; }
    try {
      const json = await apiCreateProduct(prodTitle, prodDesc, parseFloat(prodPrice), prodSubcat);
      if (json.data?.createProduct) {
        alert('Товар отправлен на модерацию администратору!');
        setProdTitle(''); setProdDesc(''); setProdPrice(''); setProdSubcat('');
      } else { alert('Ошибка создания товара'); }
    } catch (err) { console.error(err); }
  };

  const handleApproveProduct = async (id: string) => {
    try {
      const json = await apiApproveProduct(id);
      if (json.data?.approveProduct && userId) {
        alert('Товар успешно одобрен и добавлен в общий каталог!');
        loadData(userId);
      }
    } catch (err) { console.error(err); }
  };

  const totalSum = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border rounded-xl p-8 shadow-sm max-w-md w-full space-y-4">
          <h2 className="text-2xl font-black text-gray-800 text-center">
            {isRegisterMode ? 'Регистрация' : 'Вход'}
          </h2>
          {errorMsg && <p className="text-red-500 text-xs text-center font-semibold">{errorMsg}</p>}
          <form onSubmit={handleAuth} className="space-y-3">
            <input 
              type="email" placeholder="Email" required value={emailInput} 
              onChange={(e) => setEmailInput(e.target.value)} 
              className="w-full border rounded-lg p-2.5 text-sm" 
            />
            <input 
              type="password" placeholder="Пароль" required value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              className="w-full border rounded-lg p-2.5 text-sm" 
            />
            
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Выберите тип аккаунта:</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white font-semibold text-gray-700"
                >
                  <option value="USER">Покупатель (Сборка корзины и оплата)</option>
                  <option value="SELLER">Продавец (Размещение товаров)</option>
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white font-bold rounded-lg p-2.5 text-sm hover:bg-blue-700 transition">
              {isRegisterMode ? 'Создать аккаунт' : 'Войти'}
            </button>
          </form>
          <button 
            onClick={() => setIsRegisterMode(!isRegisterMode)} 
            className="w-full text-xs text-blue-600 hover:underline text-center block"
          >
            {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 w-full">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Боковая панель профиля */}
        <div className="md:col-span-1 bg-white border rounded-xl p-6 shadow-sm h-fit space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-black text-gray-900">Профиль</h2>
            <p className="text-xs text-gray-400 font-mono mt-1">ID: {userId}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600"><strong className="text-gray-800">Email:</strong> {userEmail}</p>
            <p className="text-gray-600">
              <strong className="text-gray-800">Статус:</strong>{' '}
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold uppercase">
                {userRole === 'USER' ? 'Покупатель' : userRole === 'SELLER' ? 'Продавец' : 'Администратор'}
              </span>
            </p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('userId'); setUserId(null); }} 
            className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-bold p-2 rounded-lg text-xs transition"
          >
            Выйти
          </button>
        </div>

        {/* Правая панель контента */}
        <div className="md:col-span-2 space-y-6">
          
          {/* РОЛЬ 1: ИНТЕРФЕЙС ПОКУПАТЕЛЯ */}
          {userRole === 'USER' && (
            <>
              <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-gray-900 border-b pb-3">Текущая корзина</h2>
                {loading ? <p className="text-sm text-gray-400 text-center py-4">Загрузка...</p> : cartItems.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Корзина пуста. Добавьте книги, игрушки или мебель в каталоге.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {cartItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div className="flex flex-col">
                          <p className="font-semibold text-gray-800 text-sm">{item.product.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400">{item.quantity} шт.</span>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium">Удалить</button>
                          </div>
                        </div>
                        <p className="font-black text-gray-900 text-sm">{item.product.price * item.quantity} ₽</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t pt-3 flex items-center justify-between font-bold text-gray-800">
                  <span>Итого к оплате:</span>
                  <span className="text-xl font-black text-blue-600">{totalSum} ₽</span>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Тестовые платежные шлюзы:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => handlePayment('YUKASSA')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-xl text-sm transition shadow-sm">Демо-переход в ЮKassa</button>
                    <button onClick={() => handlePayment('SBP')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl text-sm transition shadow-sm">Демо-шлюз СБП по QR</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 border-b pb-3 mb-4">История заказов</h2>
                {orders.length === 0 ? <p className="text-sm text-gray-400">Нет оформленных заказов.</p> : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border rounded-xl p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-xs font-mono text-gray-400">Заказ #{order.id.substring(0, 8)}</p>
                          <p className="text-xs text-gray-400 mt-1">Дата: {order.createdAt ? new Date(Number(order.createdAt)).toLocaleDateString('ru-RU') : 'Не указана'}</p>
                        </div>
                        <span className="text-xs font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-full w-fit">Оплачен</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

                   {/* РОЛЬ 2: ИНТЕРФЕЙС ПРОДАВЦА */}
          {userRole === 'SELLER' && (
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-black text-gray-900 border-b pb-3">Размещение нового товара</h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Название товара *</label>
                    <input type="text" required value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} placeholder="Например: Стул деревянный" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Цена (₽) *</label>
                    <input type="number" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="3500" className="w-full border rounded-lg p-2.5 text-sm" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Выберите подкатегорию *</label>
                  <select required value={prodSubcat} onChange={(e) => setProdSubcat(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white font-semibold text-gray-700">
                    <option value="">-- Выберите подкатегорию из базы данных --</option>
                    {dbCategories && dbCategories.map((cat: any) => (
                      <optgroup key={cat.id} label={cat.name}>
                        {cat.subcategories && cat.subcategories.map((sub: any) => (
                          <option key={sub.id} value={sub.id}>
                            {cat.name} → {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Описание товара</label>
                  <textarea rows={3} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Подробные характеристики товара..." className="w-full border rounded-lg p-2.5 text-sm" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold rounded-lg p-3 text-sm hover:bg-blue-700 transition shadow-sm">
                  Опубликовать на модерацию
                </button>
              </form>
            </div>
          )}

          {/* РОЛЬ 3: ПАНЕЛЬ АДМИНИСТРАТОРА */}
          {userRole === 'ADMIN' && (
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-black text-gray-900 border-b pb-3">Модерация новых поступлений</h2>
              {pendingProducts.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Нет активных заявок на модерацию. Все товары проверены!</p>
              ) : (
                <div className="space-y-4 divide-y divide-gray-100">
                  {pendingProducts.map((prod: any) => (
                    <div key={prod.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-800">{prod.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2">{prod.description || 'Описание отсутствует'}</p>
                        <p className="text-sm font-black text-blue-600">{prod.price} ₽</p>
                      </div>
                      <button
                        onClick={() => handleApproveProduct(prod.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xs transition shadow-sm whitespace-nowrap"
                      >
                        Одобрить в каталог
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
