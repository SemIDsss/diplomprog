'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';

// Компонент для загрузки скрипта Метрики
export function YandexMetricaProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!YANDEX_METRICA_ID) return;

    // Загружаем скрипт Метрики
    const script = document.createElement('script');
    script.innerHTML = `
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

      ym(${YANDEX_METRICA_ID}, "init", {
        defer: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true
      });
    `;
    document.head.appendChild(script);

    return () => {
      // Очистка при размонтировании (опционально)
      const scripts = document.querySelectorAll('script');
      scripts.forEach(s => {
        if (s.innerHTML.includes('metrika/tag.js')) {
          s.remove();
        }
      });
    };
  }, []);

  return <>{children}</>;
}

// Автоматическое отслеживание просмотров страниц
export function YandexMetricaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ym && YANDEX_METRICA_ID) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      (window as any).ym(YANDEX_METRICA_ID, 'hit', url, { title: document.title });
    }
  }, [pathname, searchParams]);

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