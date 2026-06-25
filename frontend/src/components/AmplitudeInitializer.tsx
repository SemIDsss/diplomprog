// frontend/src/components/AmplitudeInitializer.tsx
'use client';

import { useEffect } from 'react';
import { initAmplitude } from '@/lib/amplitude';

export function AmplitudeInitializer() {
  useEffect(() => {
    initAmplitude();
  }, []);

  return null;
}