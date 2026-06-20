'use client';

import React, { useState } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
  status?: string;
  imageUrl?: string;
  category?: string;
  subcategory?: string;
  stock?: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  specs?: Record<string, string>;
  rejectReason?: string;
}

interface AdminProps {
  list?: Product[];
  onMod?: (id: string, st: 'APPROVED' | 'REJECTED', r?: string) => void;
}

export default function AdminDashboard({ list = [], onMod }: AdminProps) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [rejId, setRejId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  
  const activeRequests = list.filter(r => r.status === 'PENDING');

  const rejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejId || !reason.trim()) return;
    if (onMod) onMod(rejId, 'REJECTED', reason.trim());
    setRejId(null);
    setReason('');
  };

  if (activeRequests.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-6 md:p-8 text-center text-gray-400">
        <p className="text-lg font-medium">Нет заявок на модерацию</p>
        <p className="text-sm mt-1">Очередь пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white p-3 md:p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="font-bold text-sm md:text-base">Панель верификации</h1>
        <span className="text-xs px-3 py-1 bg-blue-600 rounded font-bold">ADMIN</span>
      </div>

      <div className="space-y-4">
        {activeRequests.map(req => (
          <div key={req.id} className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
              <span className="font-bold text-gray-900 text-sm md:text-base">{req.title}</span>
              <span className="font-black text-blue-600 text-sm md:text-base">{req.price} ₽</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg">
              <div 
                onClick={() => setZoom(req.imageUrl || null)} 
                className="w-16 h-16 border rounded bg-white cursor-zoom-in overflow-hidden mx-auto sm:mx-0"
              >
                {req.imageUrl && <img src={req.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="sm:col-span-3 space-y-1 text-xs text-gray-600">
                <p><strong>Категория:</strong> {req.category} ({req.subcategory})</p>
                <p><strong>Склад:</strong> {req.stock || 0} шт.</p>
                <p><strong>Логистика:</strong> {req.weight || 0} кг | {req.width}×{req.height}×{req.length} см</p>
                {req.specs && Object.entries(req.specs).map(([k, v]) => (
                  <p key={k}><strong>{k}:</strong> {v}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 font-bold text-xs">
              <button 
                onClick={() => onMod && onMod(req.id, 'APPROVED')} 
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition active:scale-95 min-h-[44px]"
              >
                ✓ Одобрить
              </button>
              <button 
                onClick={() => setRejId(req.id)} 
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition active:scale-95 min-h-[44px]"
              >
                ✕ Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальные окна - адаптивные */}
      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <img src={zoom} alt="" className="max-w-full max-h-[80vh] rounded bg-white p-1" />
        </div>
      )}

      {rejId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={rejectSubmit} className="bg-white p-4 md:p-6 rounded-xl space-y-4 w-full max-w-md">
            <h3 className="font-bold text-gray-900 text-sm">Причина отказа</h3>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Укажите причину..."
              className="w-full border p-3 rounded-lg h-24 resize-none text-sm outline-none focus:border-red-500"
              required 
            />
            <div className="flex gap-3 justify-end font-bold text-sm">
              <button type="button" onClick={() => { setRejId(null); setReason(''); }} className="bg-gray-100 px-4 py-2 rounded-lg min-h-[44px]">
                Отмена
              </button>
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg min-h-[44px]">
                Отправить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}