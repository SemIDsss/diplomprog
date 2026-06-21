// frontend/src/app/global-error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` — это стандартный компонент ошибок Next.js. */}
        <NextError statusCode={500} />
      </body>
    </html>
  );
}