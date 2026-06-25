'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      {!isHome && <Header />}
      <div className={!isHome ? 'pt-16' : ''}>
        {children}
      </div>
    </>
  );
}