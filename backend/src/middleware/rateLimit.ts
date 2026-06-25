// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// Общий лимит для всех запросов
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: { error: 'Слишком много запросов, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимит для чувствительных операций (оплата, регистрация)
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 минут
  max: 10, // максимум 10 запросов
  message: { error: 'Слишком много попыток, подождите 5 минут' },
  standardHeaders: true,
  legacyHeaders: false,
});