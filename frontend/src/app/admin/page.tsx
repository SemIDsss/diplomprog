'use client';
import React, { useState } from 'react';
import { Product } from '../profile/page';

interface AdminProps {
  list?: Product[];
  onMod?: (id: string, st: 'APPROVED' | 'REJECTED', r?: string) => void;
}

export default function AdminDashboard({ list = [], onMod }: AdminProps) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [rejId, setRejId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Выбираем строго товары со статусом ожидания PENDING
  const activeRequests = list.filter(r => r.status === 'PENDING');

  const rejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejId || !reason.trim()) return;
    
    if (onMod) onMod(rejId, 'REJECTED', reason.trim());
    
    setRejId(null);
    setReason('');
  };

  return (
    <div className="space-y-4 text-xs text-gray-800">
      <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center shadow-sm">
        <h1 className="font-bold uppercase tracking-wide">Панель верификации спецификаций</h1>
        <span className="text-xxs px-2 bg-blue-600 rounded font-bold">ADMIN MODE</span>
      </div>

      <div className="space-y-3">
        {activeRequests.length === 0 ? (
          <p className="text-gray-400 text-center p-6 bg-white border rounded-xl font-medium shadow-sm">
            Активных заявок от продавцов не обнаружено. Очередь пуста.
          </p>
        ) : (
          activeRequests.map(req => (
            <div key={req.id} className="bg-white border p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-sm text-gray-900">{req.title}</span>
                <span className="font-black text-blue-600 text-sm">{req.price} ₽</span>
              </div>

              {/* Информационная таблица параметров карточки */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg border">
                <div 
                  onClick={() => setZoom(req.imageUrl)} 
                  className="w-16 h-16 border rounded bg-white cursor-zoom-in overflow-hidden relative group mx-auto sm:mx-0"
                >
                  <img src={req.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="sm:col-span-3 space-y-1 font-medium text-xxs text-gray-600">
                  <p><strong>Модуль / Категория:</strong> {req.category} ({req.subcategory})</p>
                  <p><strong>Ресурсы склада:</strong> {req.stock} шт.</p>
                  <p><strong>Параметры логистики:</strong> {req.weight} кг | {req.width}х{req.height}х{req.length} см</p>
                  {Object.entries(req.specs).map(([k, v]) => (
                    <p key={k}><strong>{k}:</strong> {v}</p>
                  ))}
                </div>
              </div>

              {/* Кнопки модерации */}
              <div className="flex gap-3 font-bold text-xxs">
                <button 
                  onClick={() => onMod && onMod(req.id, 'APPROVED')} 
                  className="flex-1 bg-green-600 text-white py-1.5 rounded-md hover:bg-green-700 transition"
                >
                  ✓ Одобрить спецификацию
                </button>
                <button 
                  onClick={() => setRejId(req.id)} 
                  className="flex-1 bg-red-600 text-white py-1.5 rounded-md hover:bg-red-700 transition"
                >
                  ✕ Отклонить и указать причину
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно увеличения картинки */}
      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <img src={zoom} alt="" className="max-w-full max-h-[80vh] rounded bg-white p-1 shadow-2xl" />
        </div>
      )}

      {/* Модальное окно указания причины отказа */}
      {rejId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={rejectSubmit} className="bg-white p-4 rounded-xl space-y-3 w-full max-w-xs border shadow-2xl">
            <h3 className="font-bold text-gray-900 text-xs">Укажите причину отказа продавцу</h3>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Пример: Неверные габариты упаковки для СДЭК..."
              className="w-full border p-2 rounded-lg h-16 resize-none text-xxs outline-none focus:border-red-500" 
              required 
            />
            <div className="flex gap-2 justify-end font-bold text-xxs">
              <button type="button" onClick={() => { setRejId(null); setReason(''); }} className="bg-gray-100 px-3 py-1 rounded-lg">Отмена</button>
              <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded-lg">Отправить</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
