import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Для Upstash нужно включить TLS
export const redis = new Redis(redisUrl, {
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});