// app/payment-success/page.tsx
import { Suspense } from 'react';
import PaymentSuccessContent from './PaymentSuccessContent';

export const dynamic = 'force-dynamic'; 

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Проверка статуса оплаты...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}