'use client';

import * as Sentry from '@sentry/nextjs';

export default function TestSentryPage() {
  const testError = () => {
    try {
      throw new Error('Тестовая ошибка Sentry (фронтенд)');
    } catch (error) {
      Sentry.captureException(error);
      alert('Ошибка отправлена в Sentry');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Тест Sentry</h1>
      <button
        onClick={testError}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl"
      >
        Отправить тестовую ошибку
      </button>
    </div>
  );
}