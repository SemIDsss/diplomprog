const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/:path*',
      },
    ];
  },

  // Дополнительные настройки Next.js (если нужны)
  images: {
    domains: ['localhost', 'via.placeholder.com', 'unsplash.com'],
  },

  // Отключаем строгую проверку типов при сборке (опционально)
  typescript: {
    ignoreBuildErrors: false, 
  },

  
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Настройки для продакшена
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

// Конфигурация Sentry
module.exports = withSentryConfig(nextConfig, {
  
  org: process.env.SENTRY_ORG || 'diplom-market',
  project: process.env.SENTRY_PROJECT || 'diplom-market',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  
  // Дополнительные настройки Sentry
  silent: true, // Подавляет лишние логи
  hideSourcemaps: true, // Скрывает source maps в продакшене

 
});