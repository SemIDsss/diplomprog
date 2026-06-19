'use client';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  desc: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModalConfirm({
  isOpen,
  title,
  desc,
  onConfirm,
  onCancel
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 
      flex items-center justify-center p-4 z-50 
      animate-fadeIn"
    >
      <div className="bg-white p-5 rounded-2xl 
        border shadow-xl w-full max-w-xs space-y-4"
      >
        <div className="space-y-1">
          <h3 className="font-black text-sm 
            text-gray-900"
          >
            {title}
          </h3>
          <p className="text-xxs text-gray-400 
            font-medium leading-relaxed"
          >
            {desc}
          </p>
        </div>
        <div className="flex gap-2 font-bold 
          text-xxs justify-end"
        >
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 
              px-3 py-1.5 rounded-lg transition"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 
              text-white px-3 py-1.5 rounded-lg 
              transition shadow-sm"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
