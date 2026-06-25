// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Для Vercel (опционально, но полезно)
  output: 'standalone',

  // Прокси для продакшена: все запросы к /api/* и /graphql
  // перенаправляются на ваш бэкенд на Render
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://diplomprog-1.onrender.com/api/:path*',
      },
      {
        source: '/graphql',
        destination: 'https://diplomprog-1.onrender.com/graphql',
      },
    ];
  },

  // Настройки изображений (оставьте свои)
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

  // Остальное (TypeScript, ESLint, минификация)
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

module.exports = nextConfig;