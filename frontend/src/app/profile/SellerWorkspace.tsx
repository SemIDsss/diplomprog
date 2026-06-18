'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';

export function SellerWorkspace({ user }: { user: any }) {
  // Основные параметры карточки
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [category, setCategory] = useState('Электроника');
  const [brand, setBrand] = useState('');
  const [image, setImage] = useState('');

  // Логистические параметры упаковки
  const [weightGrams, setWeightGrams] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [lengthMm, setLengthMm] = useState('');

  // Идентификаторы и складские атрибуты
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');

  // Расширенные коммерческие характеристики
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Атомарный обработчик отправки расширенной карточки
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Гарантированное извлечение токена из всех хранилищ
    const token =
      Cookies.get('token') || localStorage.getItem('token');
    if (!token) {
      setError('Токен сессии не найден. Перезайдите на /auth');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:4000/api/products/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name,
            description,
            price: parseFloat(price) || 0,
            stock: parseInt(stock, 10) || 1,
            category,
            image: image.trim() || null,
            sku: sku.trim() || null,
            barcode: barcode.trim() || null,
            brand: brand.trim() || null,
            weightGrams: parseInt(weightGrams, 10) || 100,
            widthMm: parseInt(widthMm, 10) || 100,
            heightMm: parseInt(heightMm, 10) || 100,
            lengthMm: parseInt(lengthMm, 10) || 100,
            // Передача расширенных атрибутов в JSONB-контур СУБД
            model: model.trim() || null,
            color: color.trim() || null,
            material: material.trim() || null,
            warrantyMonths: parseInt(warrantyMonths, 10) || 12
          })
        }
      );

      const contentType = response.headers.get('content-type');
      if (
        !contentType ||
        !contentType.includes('application/json')
      ) {
        throw new Error('Сессия невалидна. Перезайдите в аккаунт.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка авторизации');
      }

      setSuccess(true);
      setName('');
      setDescription('');
      setPrice('');
      setImage('');
      setSku('');
      setBarcode('');
      setBrand('');
      setModel('');
      setColor('');
      setMaterial('');
      setWarrantyMonths('');
      setWeightGrams('');
      setLengthMm('');
      setWidthMm('');
      setHeightMm('');
      window.dispatchEvent(new Event('storage_update'));
    } catch (err: any) {
      setError(err.message || 'Сбой верификации токена');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full max-w-xl space-y-4 pb-20">
      
      {/* Спецификация Главе 2 ВКР */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-800 space-y-1.5 leading-relaxed">
        <h4 className="font-black uppercase tracking-wider">
          Контур расширенных характеристик карточки:
        </h4>
        <p>
          • <span className="font-bold">Медиа-сервер:</span> Поле ссылки на изображение инжектирует URL в CDN-хранилище маркетплейса.
        </p>
        <p>
          • <span className="font-bold">Коммерческие атрибуты:</span> Поля цвета, модели и гарантии сопоставляются с фильтрами поискового GraphQL-ядра каталога.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="w-full bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm"
      >
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-black text-slate-900 text-base">
            Новая карточка товара
          </h3>
          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
            Конструктор контента
          </span>
        </div>

        {error && (
          <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="text-xs font-bold text-green-600 bg-green-50 p-2.5 rounded-xl border border-green-100">
            ✔ Карточка создана и успешно отправлена в очередь модерации!
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          
          {/* СЕКЦИЯ 1: Базовая информация */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase block">1. Основные параметры</label>
            <input type="text" placeholder="Название товара (например, Смартфон Phone 15 Pro)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2.5 border rounded-xl text-sm min-h-[44px]" />
            <textarea placeholder="Аннотация и подробное описание преимуществ гаджета" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm min-h-[60px]" />
          </div>

          {/* СЕКЦИЯ 2: Медиа и изображения */}
          <div className="space-y-2 border-t pt-3">
            <label className="text-[11px] font-black text-slate-500 uppercase block">2. Галерея и Изображения</label>
            <input type="url" placeholder="Ссылка на главное изображение (URL из CDN/хранилища)" value={image} onChange={e => setImage(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm min-h-[44px]" />
          </div>

          {/* СЕКЦИЯ 3: Цены и Склад */}
          <div className="space-y-2 border-t pt-3">
            <label className="text-[11px] font-black text-slate-500 uppercase block">3. Коммерческие условия</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Цена на витрине (₽)" value={price} onChange={e => setPrice(e.target.value)} required className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
              <input type="number" placeholder="Доступно на складе (шт)" value={stock} onChange={e => setStock(e.target.value)} required className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
            </div>
          </div>

          {/* СЕКЦИЯ 4: Расширенные товарные характеристики */}
          <div className="space-y-2 border-t pt-3">
            <label className="text-[11px] font-black text-slate-500 uppercase block">4. Технические характеристики товара</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Бренд / Производитель" value={brand} onChange={e => setBrand(e.target.value)} required className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
              <input type="text" placeholder="Заводская модель изделия" value={model} onChange={e => setModel(e.target.value)} className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Цвет корпуса / исполнения" value={color} onChange={e => setColor(e.target.value)} className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
              <input type="text" placeholder="Основной материал" value={material} onChange={e => setMaterial(e.target.value)} className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Гарантия (в месяцах)" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} className="p-2.5 border rounded-xl text-sm min-h-[44px]" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm bg-white min-h-[44px]">
                <option value="Электроника">Электроника</option>
                <option value="Гаджеты">Гаджеты</option>
                <option value="Аудио">Аудио</option>
                <option value="Компьютеры">Компьютеры</option>
              </select>
            </div>
          </div>

          {/* СЕКЦИЯ 5: Идентификаторы */}
          <div className="grid grid-cols-2 gap-2 border-t pt-3">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">Артикул (SKU)</label>
              <input type="text" placeholder="Внутренний код" value={sku} onChange={e => setSku(e.target.value)} className="w-full p-2 border rounded-xl text-xs min-h-[44px]" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase block mb-1">Штрихкод (EAN-13)</label>
              <input type="text" placeholder="Код номенклатуры" value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full p-2 border rounded-xl text-xs min-h-[44px]" />
            </div>
          </div>

          {/* СЕКЦИЯ 6: Логистика */}
          <div className="border-t pt-3 space-y-2">
            <span className="text-[11px] font-black text-slate-500 uppercase block">
              5. Физические параметры упаковки груза (Для СДЭК)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Вес брутто (граммы)" value={weightGrams} onChange={e => setWeightGrams(e.target.value)} className="p-2 border rounded-xl text-xs min-h-[44px]" />
              <input type="number" placeholder="Длина коробки (мм)" value={lengthMm} onChange={e => setLengthMm(e.target.value)} className="p-2 border rounded-xl text-xs min-h-[44px]" />
              <input type="number" placeholder="Ширина коробки (мм)" value={widthMm} onChange={e => setWidthMm(e.target.value)} className="p-2 border rounded-xl text-xs min-h-[44px]" />
              <input type="number" placeholder="Высота коробки (мм)" value={heightMm} onChange={e => setHeightMm(e.target.value)} className="p-2 border rounded-xl text-xs min-h-[44px]" />
            </div>
          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl transition-all min-h-[44px] active:scale-[0.99] shadow-md shadow-blue-100"
        >
          {loading ? 'Валидация токена сессии...' : '📦 Опубликовать лот и характеристики'}
        </button>
      </form>
    </div>
  );
}


