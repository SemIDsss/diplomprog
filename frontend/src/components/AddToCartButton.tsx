'use client';

import React, { useState } from 'react';

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      // ИСПРАВЛЕНО: Динамически берем ID реально вошедшего пользователя
      const userId = localStorage.getItem('userId'); 

      if (!userId) {
        alert('Пожалуйста, войдите в свой личный кабинет для добавления товаров в корзину!');
        return;
      }

      const res = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation AddToCart($userId: String!, $productId: String!, $quantity: Int!) {
              addToCart(userId: $userId, productId: $productId, quantity: $quantity) {
                id
                quantity
              }
            }
          `,
          variables: { userId, productId, quantity: 1 }
        })
      });

      const responseData = await res.json();
      
      if (responseData.errors) {
        console.error('GraphQL ошибки добавления:', responseData.errors);
        alert('Не удалось добавить товар. Ошибка на сервере.');
        return;
      }

      if (res.ok) {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
      }
    } catch (error) {
      console.error('Сетевая ошибка:', error);
      alert('Сбой сети при добавлении в корзину.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
        isAdded 
          ? 'bg-green-600 text-white shadow-inner' 
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? '...' : isAdded ? 'Добавлено ✓' : 'В корзину'}
    </button>
  );
}
