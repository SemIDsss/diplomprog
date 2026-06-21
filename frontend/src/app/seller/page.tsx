'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, Package, Upload, X, User, LogOut, 
  Image as ImageIcon, Tag, Calendar, Ruler, Scale, 
  MapPin, Palette, Layers, Sparkles, Star, ChevronUp 
} from 'lucide-react';

interface ProductForm {
  title: string;
  description: string;
  price: string;
  subcategoryId: string;
  sku: string;
  brand: string;
  material: string;
  color: string;
  weight: string;
  width: string;
  height: string;
  depth: string;
  year: string;
  country: string;
  season: string;
  collection: string;
  images: string[];
}

export default function SellerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    price: '',
    subcategoryId: '',
    sku: '',
    brand: '',
    material: '',
    color: '',
    weight: '',
    width: '',
    height: '',
    depth: '',
    year: '',
    country: '',
    season: '',
    collection: '',
    images: []
  });
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== 'SELLER' && userData.role !== 'ADMIN') {
        router.push('/buyer');
        return;
      }
      setUser(userData);
    } catch (e) {
      router.push('/login');
    }
    fetchCategories();
    fetchSellerProducts();
    setLoading(false);
  }, [router]);

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

  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `query GetProducts($userId: String!) {
            products(subcategoryId: null, search: null) {
              id title price status sku brand material color weight images
            }
          }`,
          variables: { userId }
        })
      });
      const json = await res.json();
      if (json.data?.products) setProducts(json.data.products);
    } catch (e) { console.error(e); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setForm({ ...form, images: [...form.images, imageUrl.trim()] });
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          query: `
            mutation CreateProduct(
              $title: String!, $description: String, $price: Float!, $subcategoryId: String!
              $sku: String, $brand: String, $material: String, $color: String
              $weight: Float, $width: Float, $height: Float, $depth: Float
              $year: Int, $country: String, $season: String, $collection: String
              $images: [String!]
            ) {
              createProduct(
                title: $title, description: $description, price: $price, subcategoryId: $subcategoryId
                sku: $sku, brand: $brand, material: $material, color: $color
                weight: $weight, width: $width, height: $height, depth: $depth
                year: $year, country: $country, season: $season, collection: $collection
                images: $images
              ) { id title }
            }
          `,
          variables: {
            ...form,
            price: parseFloat(form.price),
            weight: form.weight ? parseFloat(form.weight) : null,
            width: form.width ? parseFloat(form.width) : null,
            height: form.height ? parseFloat(form.height) : null,
            depth: form.depth ? parseFloat(form.depth) : null,
            year: form.year ? parseInt(form.year) : null,
          }
        })
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);
      alert('✅ Товар создан и отправлен на модерацию!');
      setForm({
        title: '', description: '', price: '', subcategoryId: '',
        sku: '', brand: '', material: '', color: '',
        weight: '', width: '', height: '', depth: '',
        year: '', country: '', season: '', collection: '',
        images: []
      });
      fetchSellerProducts();
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    ['token', 'user', 'userId', 'cart'].forEach(key => localStorage.removeItem(key));
    router.push('/login');
  };

  const scrollToTop = () => {
    pageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-3 text-sm">Загрузка...</p>
      </div>
    </div>
  );

  return (
    <div ref={pageRef} className="min-h-screen bg-[#f5f5f5] pb-28">
      {/* Шапка продавца */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="container-mobile py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Панель продавца</h1>
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

      <div className="container-mobile py-4 space-y-6 pb-8">
        {/* Форма создания товара */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> Новый товар
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Название *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Цена (₽) *</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Описание</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Категория *</label>
              <select
                name="subcategoryId"
                value={form.subcategoryId}
                onChange={handleChange}
                className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                required
              >
                <option value="">Выберите подкатегорию</option>
                {categories.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.subcategories.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {cat.name} → {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Характеристики */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Tag size={16} /> Характеристики
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Артикул (SKU)</label>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Бренд</label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="Nike, IKEA..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Материал</label>
                  <input
                    type="text"
                    name="material"
                    value={form.material}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="Дуб, пластик..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Цвет</label>
                  <input
                    type="text"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="Белый, черный..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Год выпуска</label>
                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Страна производства</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="Китай, Россия..."
                  />
                </div>
              </div>
            </div>

            {/* Вес и габариты */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Scale size={16} /> Габариты и вес
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ширина (см)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="width"
                    value={form.width}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Высота (см)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="height"
                    value={form.height}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Глубина (см)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="depth"
                    value={form.depth}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>

            {/* Дополнительные параметры */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles size={16} /> Дополнительно
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Сезон</label>
                  <select
                    name="season"
                    value={form.season}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                  >
                    <option value="">Не указан</option>
                    <option value="Весна">Весна</option>
                    <option value="Лето">Лето</option>
                    <option value="Осень">Осень</option>
                    <option value="Зима">Зима</option>
                    <option value="Всесезонный">Всесезонный</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Коллекция</label>
                  <input
                    type="text"
                    name="collection"
                    value={form.collection}
                    onChange={handleChange}
                    className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                    placeholder="Весна 2025"
                  />
                </div>
              </div>
            </div>

            {/* Изображения */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon size={16} /> Изображения
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL изображения"
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 border border-gray-100"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-blue-700 transition active:scale-95"
                >
                  Добавить
                </button>
              </div>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden group">
                      <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </form>
        </div>

        {/* Список товаров продавца */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={20} className="text-blue-600" /> Мои товары
          </h2>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">У вас пока нет товаров</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((p) => (
                <div key={p.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{p.title}</p>
                      <p className="text-xs text-gray-400">
                        {p.price} ₽ · {p.sku || 'без артикула'}
                      </p>
                      {p.material && <p className="text-xs text-gray-400">Материал: {p.material}</p>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    p.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {p.status === 'APPROVED' ? '✅ Одобрен' :
                     p.status === 'PENDING' ? '⏳ Модерация' : '❌ Отклонен'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка прокрутки вверх */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition active:scale-95 z-50"
        >
          <ChevronUp size={24} />
        </button>
      </div>
    </div>
  );
}