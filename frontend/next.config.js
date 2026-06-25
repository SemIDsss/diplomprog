// frontend/next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ГЛАВНОЕ: серверный режим без статического экспорта

  // Прокси для API-запросов в режиме разработки
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: 'http://localhost:5000/graphql',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },

  // Настройка внешних источников изображений
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '/**',
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};


module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'diplom-market',
  project: process.env.SENTRY_PROJECT || 'diplom-market',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourcemaps: true,
});