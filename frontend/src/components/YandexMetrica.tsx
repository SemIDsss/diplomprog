'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    ym: (id: number, action: string, ...args: any[]) => void;
  }
}

export function YandexMetrica() {
  const metricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

  useEffect(() => {
    if (!metricaId) {
      console.warn('⚠️ NEXT_PUBLIC_YANDEX_METRICA_ID не задан');
      return;
    }

    // Загружаем скрипт Метрики
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js`;
    document.head.appendChild(script);

    // Инициализируем счётчик
    window.ym = window.ym || function () {
      (window.ym as any).a = (window.ym as any).a || [];
      (window.ym as any).a.push(arguments);
    };

    window.ym(Number(metricaId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });

    return () => {
      // Удаляем скрипт при размонтировании (опционально)
      // document.head.removeChild(script);
    };
  }, [metricaId]);

  return null; // компонент не рендерит UI
}

// Функция для отправки событий (используется в других компонентах)
export const sendMetricaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.ym) {
    try {
      window.ym(Number(process.env.NEXT_PUBLIC_YANDEX_METRICA_ID), 'reachGoal', eventName, params);
    } catch (e) {
      console.error('Ошибка отправки события в Яндекс.Метрику:', e);
    }
  } else {
    console.warn('⚠️ Яндекс.Метрика не загружена');
  }
};