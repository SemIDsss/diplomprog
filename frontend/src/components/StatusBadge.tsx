'use client';
import React from 'react';

interface BadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function StatusBadge({ 
  status 
}: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 
      px-2.5 py-1 rounded-full text-xxs font-black border 
      ${status === 'APPROVED' 
        ? 'bg-green-50 text-green-700 border-green-200' 
        : status === 'PENDING' 
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
        : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full 
        ${status === 'APPROVED' 
          ? 'bg-green-500 animate-pulse' 
          : status === 'PENDING' 
          ? 'bg-yellow-500 animate-bounce' 
          : 'bg-red-500'
        }`} 
      />
      {status === 'APPROVED' && 'Одобрен'}
      {status === 'PENDING' && 'На проверке'}
      {status === 'REJECTED' && 'Отклонен'}
    </span>
  );
}
