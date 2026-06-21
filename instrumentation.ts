// frontend/instrumentation.ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Инициализация для серверной части (Node.js)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  // Инициализация для Edge Runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;