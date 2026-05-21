'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  reviews?: Review[];
  ratingAvg?: number; 
  image?: string;
}


const categoriesList = [
  { id: 'all', title: 'Все товары', value: '' },
  { id: 'smartphones', title: 'Смартфоны', value: 'Смартфоны' },
  { id: 'laptops', title: 'Ноутбуки', value: 'Ноутбуки' },
  { id: 'accessories', title: 'Аксессуары', value: 'Аксессуары' },
  { id: 'audio', title: 'Аудио', value: 'Аудио' }
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Читаем категорию из URL, если она была передана с главной страницы
  const categoryParam = searchParams.get('category') || '';

  const [search, setSearch] = useState('');
  
  //  Инициализируем состояние актуальным значением из URL-параметра
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Состояния для формы нового отзыва
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Синхронизируем состояние фильтра, если параметр в URL изменился извне (например, при переходе)
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);


  // Запрос к бэкенду с поддержкой фильтрации по поисковой строке и категории
  const fetchProducts = async (queryText: string, catParam: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProducts($query: String!, $category: String) {
              searchProducts(query: $query, category: $category) { 
                id name price stock category description ratingAvg image
                reviews { id userName rating comment }
              }
            }
          `,
          variables: { 
            query: queryText,
            category: catParam || undefined // Если пустая строка, передаем undefined, чтобы бэкенд не фильтровал
          }
        })
      });

      const result = await response.json();
      setProducts(result.data?.searchProducts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Вызываем загрузку при изменении текста поиска или выбранной категории
  useEffect(() => {
    fetchProducts(search, selectedCategory);
  }, [search, selectedCategory]);

  // Изменение категории с обновлением URL-адреса
  const handleCategoryChange = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    if (categoryValue) {
      router.push(`/catalog?category=${categoryValue}`);
    } else {
      router.push('/catalog');
    }
  };

  const addToCart = (product: Product) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemIndex = existingCart.findIndex((item: any) => item.id === product.id);
    if (itemIndex > -1) existingCart[itemIndex].quantity += 1;
    else existingCart.push({ ...product, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(existingCart));
    alert(`Товар "${product.name}" добавлен в корзину!`);
  };

  const handleSendReview = async (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/products/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, userName: reviewName, rating: reviewRating, comment: reviewComment })
      });
      if (res.ok) {
        alert('Отзыв успешно добавлен!');
        setReviewName('');
        setReviewComment('');
        setActiveProductId(null);
        fetchProducts(search, selectedCategory); 
      }
    } catch (err) {
      alert('Ошибка при отправке отзыва');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '28px', color: '#1a1a1a', margin: '0 0 20px 0' }}>Каталог товаров</h2>
      
      {/* КНОПКИ-ТЕГИ ДЛЯ ВЫБОРА КАТЕГОРИИ */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '25px' }}>
        {categoriesList.map((cat) => {
          const isCurrent = selectedCategory === cat.value;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.value)}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: isCurrent ? '1px solid #0070f3' : '1px solid #ddd',
                backgroundColor: isCurrent ? '#0070f3' : 'white',
                color: isCurrent ? 'white' : '#333',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat.title}
            </button>
          );
        })}
      </div>
      
      <input
        type="text"
        placeholder="Поиск техники в выбранной категории..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '14px', boxSizing: 'border-box', marginBottom: '30px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
      />

      {loading ? <p>Загрузка каталога...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {products.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Товары в данной категории не найдены.</p>
          ) : products.map((product) => (
            <div key={product.id} style={{ backgroundColor: 'white', border: '1px solid #e1e1e1', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'grid', gridTemplateColumns: '180px 1fr', gap: '25px' }}>
              
              {/* ЛЕВАЯ КОЛОНКА: ИЗОБРАЖЕНИЕ ТОВАРА */}
              <div style={{ width: '180px', height: '180px', backgroundColor: '#f9f9f9', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
                <img 
                  src={product.image || 'https://unsplash.com'} 
                  alt={product.name} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>

              {/* ПРАВАЯ КОЛОНКА: ИНФОРМАЦИЯ И ОТЗЫВЫ */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '12px', backgroundColor: '#eef2f6', color: '#0070f3', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{product.category}</span>
                    <h3 style={{ fontSize: '22px', margin: '10px 0 5px 0' }}>{product.name}</h3>
                    
                    {/* РЕЙТИНГ ЗВЕЗД */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
                      <span style={{ color: '#f39c12', fontSize: '16px' }}>
                        {product.ratingAvg && product.ratingAvg > 0 
                          ? '★'.repeat(Math.round(product.ratingAvg)) + '☆'.repeat(5 - Math.round(product.ratingAvg)) 
                          : '☆☆☆☆☆'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>
                        {product.ratingAvg && product.ratingAvg > 0 ? `${product.ratingAvg} / 5` : 'Нет оценок'}
                      </span>
                    </div>

                    <p style={{ color: '#666', margin: '10px 0 5px 0' }}>{product.description}</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3', margin: '15px 0' }}>{product.price.toLocaleString()} ₽</p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', color: product.stock > 0 ? 'green' : 'red', marginBottom: '10px' }}>
                      {product.stock > 0 ? `● В наличии: ${product.stock} шт.` : '❌ Нет на складе'}
                    </p>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      style={{ padding: '10px 20px', backgroundColor: product.stock > 0 ? '#0070f3' : '#ccc', color: 'white', border: 'none', borderRadius: '6px', cursor: product.stock > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                    >
                      В корзину
                    </button>
                  </div>
                </div>

                {/* Блок отзывов */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Отзывы покупателей ({product.reviews?.length || 0})</h4>
                  
                  {product.reviews && product.reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                      {product.reviews.map((rev) => (
                        <div key={rev.id} style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <strong>{rev.userName}</strong>
                            <span style={{ color: '#f39c12' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                          </div>
                          <p style={{ margin: 0, color: '#444' }}>{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontSize: '14px' }}>Отзывов об этом товаре пока нет.</p>
                  )}

                  {/* Кнопка открытия формы отзыва */}
                  {activeProductId !== product.id ? (
                    <button 
                      type="button" 
                      onClick={() => setActiveProductId(product.id)} 
                      style={{ background: 'none', border: 'none', color: '#0070f3', padding: 0, cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      + Оставить отзыв
                    </button>
                  ) : (
                    <form onSubmit={(e) => handleSendReview(e, product.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', maxWidth: '400px', backgroundColor: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                      <input type="text" placeholder="Ваше имя" value={reviewName} onChange={(e) => setReviewName(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      <label style={{ fontSize: '13px', color: '#555' }}>
                        Оценка: 
                        <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} style={{ marginLeft: '10px', padding: '4px' }}>
                          <option value="5">5 ★</option>
                          <option value="4">4 ★</option>
                          <option value="3">3 ★</option>
                          <option value="2">2 ★</option>
                          <option value="1">1 ★</option>
                        </select>
                      </label>
                      <textarea placeholder="Текст отзыва" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px' }} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ padding: '6px 12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Отправить</button>
                        <button type="button" onClick={() => setActiveProductId(null)} style={{ padding: '6px 12px', backgroundColor: '#aaa', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Отмена</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Обязательная обертка в Suspense для использования useSearchParams в Next.js
export default function CatalogPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', padding: '40px' }}>Загрузка компонентов каталога...</p>}>
      <CatalogContent />
    </Suspense>
  );
}
