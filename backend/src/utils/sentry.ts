import * as Sentry from '@sentry/node';
import 'dotenv/config';

const SENTRY_DSN = process.env.SENTRY_DSN || '';

export const initSentry = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('✅ Sentry инициализирован (бэкенд)');
  } else {
    console.warn('⚠️ SENTRY_DSN не задан, Sentry не инициализирован');
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, any>) => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level: level || 'info',
      extra: context,
    });
  }
};