/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Исправлено на порт 5000
      },
    ];
  },
};

module.exports = nextConfig;
