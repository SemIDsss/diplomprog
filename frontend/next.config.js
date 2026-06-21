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
  images: {
    domains: ['localhost', 'via.placeholder.com', 'unsplash.com'],
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

//  ВРЕМЕННО ОТКЛЮЧАЕМ SENTRY
// const { withSentryConfig } = require('@sentry/nextjs');
// module.exports = withSentryConfig(nextConfig, {
//   org: process.env.SENTRY_ORG || 'diplom-market',
//   project: process.env.SENTRY_PROJECT || 'diplom-market',
//   authToken: process.env.SENTRY_AUTH_TOKEN,
//   silent: true,
//   hideSourcemaps: true,
// });

module.exports = nextConfig;