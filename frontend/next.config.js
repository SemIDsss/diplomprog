/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Все запросы к REST API фронтенда проксируются на бэкенд Express
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        // Все запросы к GraphQL-контуру также перенаправляются на Express
        source: '/graphql',
        destination: 'http://localhost:4000/graphql',
      },
    ];
  },
};

module.exports = nextConfig;
