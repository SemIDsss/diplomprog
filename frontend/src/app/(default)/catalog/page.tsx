// app/(default)/catalog/page.tsx
import { Suspense } from 'react';
import CatalogContent from './CatalogContent';

export const dynamic = 'force-dynamic'; 

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка каталога...</div>}>
      <CatalogContent />
    </Suspense>
  );
}