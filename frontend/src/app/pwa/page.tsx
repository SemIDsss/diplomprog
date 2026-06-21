'use client';

import { useState, useEffect } from 'react';

export default function PWAPage() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setIsSupported(false);
      return;
    }

    navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
      setIsRegistered(!!reg);
    });
  }, []);

  const registerSW = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setIsRegistered(true);
      alert('✅ Service Worker зарегистрирован!');
    } catch (error) {
      alert('❌ Ошибка регистрации: ' + error);
    }
  };

  const unregisterSW = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        await reg.unregister();
        setIsRegistered(false);
        alert('✅ Service Worker отключён');
      }
    } catch (error) {
      alert('❌ Ошибка отключения: ' + error);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Ваш браузер не поддерживает Service Workers</p>
      </div>
    );
  }

  return (
    <div className="container-mobile py-8">
      <h1 className="text-2xl font-bold mb-4">PWA Настройки</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <p className="mb-4">
          Статус: {isRegistered ? (
            <span className="text-green-600 font-bold">✅ Активен</span>
          ) : (
            <span className="text-gray-400">❌ Не зарегистрирован</span>
          )}
        </p>
        {isRegistered ? (
          <button
            onClick={unregisterSW}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition"
          >
            Отключить офлайн-режим
          </button>
        ) : (
          <button
            onClick={registerSW}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Включить офлайн-режим
          </button>
        )}
        <p className="text-sm text-gray-400 mt-4">
          Включение позволит загружать сайт без интернета (кэширование страниц).
        </p>
      </div>
    </div>
  );
}