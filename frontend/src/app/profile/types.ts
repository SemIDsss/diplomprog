// src/app/profile/types.ts

// ВОЗВРАЩЕНО НА МЕСТО: Перечисление ролей для личного кабинета
export type RoleMode = 'buyer' | 'seller' | 'admin';

export interface Review {
  id: string | number;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface Product {
  id: string | number;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  image?: string;
  status?: string;
  ratingAvg?: number;
  reviews?: Review[];
  
  // Расширенные спецификации маркетплейса (SKU, весогабариты)
  brand?: string | null;
  sku?: string | null;
  barcode?: string | null;
  weightGrams?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  lengthMm?: number | null;
}

export interface CartItem extends Product {
  quantity: number;
}
