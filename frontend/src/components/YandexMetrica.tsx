'use client';

import { YandexMetricaProvider } from 'next-yandex-metrica';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';

export function YandexMetricaProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!YANDEX_METRICA_ID) return <>{children}</>;

  return (
    <YandexMetricaProvider
      tagID={YANDEX_METRICA_ID}  // ✅ tagID (с большой D)
      initOptions={{
        defer: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
      }}
    >
      {children}
    </YandexMetricaProvider>
  );
}

export function YandexMetricaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ym) {
      const ymId = YANDEX_METRICA_ID;
      if (ymId) {
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        (window as any).ym(ymId, 'hit', url, { title: document.title });
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export const sendMetricaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).ym) {
    const ymId = YANDEX_METRICA_ID;
    if (ymId) {
      (window as any).ym(ymId, 'reachGoal', eventName, params);
    }
  }
};