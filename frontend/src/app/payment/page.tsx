// app/payment/page.tsx
import { Suspense } from 'react';
import PaymentContent from './PaymentContent';

export const dynamic = 'force-dynamic'; 

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка данных оплаты...</div>}>
      <PaymentContent />
    </Suspense>
  );
}