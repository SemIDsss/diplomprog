'use client';

import { YandexMetricaProvider, useMetrica } from '@artginzburg/next-ym';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';

// Обёртка провайдера
export function YandexMetricaProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!YANDEX_METRICA_ID) {
    return <>{children}</>;
  }

  // Преобразуем строку в число
  const tagId = parseInt(YANDEX_METRICA_ID, 10);

  return (
    <YandexMetricaProvider
      tagID={tagId}
      options={{
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

// Автоматическое отслеживание просмотров страниц
export function YandexMetricaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hit } = useMetrica();

  useEffect(() => {
    if (hit && pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      hit(url, { title: document.title });
    }
  }, [pathname, searchParams, hit]);

  return null;
}

// Хелпер для отправки произвольных событий (целей)
export const sendMetricaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).ym) {
    const ymId = YANDEX_METRICA_ID;
    if (ymId) {
      (window as any).ym(ymId, 'reachGoal', eventName, params);
    }
  }
};