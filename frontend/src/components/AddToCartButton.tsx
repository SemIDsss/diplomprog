'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { sendMetricaEvent } from '@/components/YandexMetrica';
import { trackEvent } from '@/lib/amplitude';
import { getUser } from '@/lib/auth';

interface AddToCartButtonProps {
  productId: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

export function AddToCartButton({
  productId,
  productName = 'Товар',
  productPrice = 0,
  productImage
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const user = getUser();
      if (!user) {
        alert('Войдите в аккаунт');
        setLoading(false);
        return;
      }
      const userId = user.id;

      // ✅ Прямой URL
      const response = await fetch('http://localhost:5000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);

      sendMetricaEvent('add_to_cart', {
        productId,
        productName,
        price: productPrice
      });
      trackEvent('add_to_cart', {
        productId,
        productName,
        price: productPrice,
        userId
      });

      const savedCart = localStorage.getItem('cart');
      let cart = savedCart ? JSON.parse(savedCart) : [];

      const existingItem = cart.find((item: any) => item.id === productId);
      if (existingItem) {
        cart = cart.map((item: any) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        cart.push({
          id: productId,
          name: productName,
          price: productPrice,
          quantity: 1,
          image: productImage || null,
          weightGrams: 400
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      console.error('❌ Ошибка в catch:', error);
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || isAdded}
      className={`
        min-h-[36px] md:min-h-[40px] 
        px-3 md:px-4 
        rounded-lg md:rounded-xl 
        text-xs md:text-sm font-medium 
        transition-all duration-200 
        active:scale-95 
        flex items-center justify-center gap-1.5
        ${isAdded
          ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
        }
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      ) : isAdded ? (
        <>
          <Check size={16} /> В корзине
        </>
      ) : (
        <>
          <ShoppingCart size={16} /> Купить
        </>
      )}
    </button>
  );
}