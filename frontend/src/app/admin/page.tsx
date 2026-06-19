'use client';
import React, { useState } from 'react';
import { Product } from '../seller/page';

interface AdminProps {
  list?: Product[];
  onMod?: (id: string, st: 'APPROVED' | 'REJECTED', r?: string) => void;
}

export default function AdminDashboard({ list = [], onMod }: AdminProps) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [rejId, setRejId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const active = list.filter(r => r.status === 'PENDING');

  const rejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejId || !reason.trim()) return;
    if (onMod) onMod(rejId, 'REJECTED', reason.trim());
    setRejId(null); setReason('');
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between">
        <h1 className="font-bold">Панель модерации</h1>
        <span className="text-xxs px-2 bg-blue-600 rounded font-bold">ROOT</span>
      </div>

      <div className="space-y-2">
        {active.length === 0 ? (
          <p className="text-gray-400 text-center p-4 bg-white border rounded-xl">Заявок нет</p>
        ) : (
          active.map(req => (
            <div key={req.id} className="bg-white border p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-sm text-gray-900">{req.title}</span>
                <span className="font-black">{req.price} ₽</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-2 rounded-lg">
                <div onClick={() => setZoom(req.imageUrl)} className="w-16 h-16 border rounded bg-white cursor-pointer mx-auto sm:mx-0 overflow-hidden">
                  <img src={req.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p><strong>Категория:</strong> {req.category}</p>
                  <p><strong>Количество:</strong> {req.stock} шт.</p>
                  {Object.entries(req.specs).map(([k, v]) => (
                    <p key={k}><strong>{k}:</strong> {v}</p>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 font-bold">
                <button onClick={() => onMod && onMod(req.id, 'APPROVED')} className="flex-1 bg-green-600 text-white py-1 rounded-md">Принять</button>
                <button onClick={() => setRejId(req.id)} className="flex-1 bg-red-600 text-white py-1 rounded-md">Отклонить</button>
              </div>
            </div>
          ))
        )}
      </div>

      {zoom && (
        <div onClick={() => setZoom(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <img src={zoom} alt="" className="max-w-full max-h-[80vh] rounded bg-white p-1" />
        </div>
      )}

      {rejId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={rejectSubmit} className="bg-white p-4 rounded-xl space-y-3 w-full max-w-xs text-xs">
            <h3 className="font-bold text-gray-900">Укажите причину отказа</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full border p-2 rounded-lg h-16 resize-none" required />
            <div className="flex gap-2 justify-end font-bold">
              <button type="button" onClick={() => setRejId(null)} className="bg-gray-100 px-3 py-1 rounded-lg">Отмена</button>
              <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded-lg">Отправить</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
