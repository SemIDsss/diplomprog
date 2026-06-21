'use client';

import { useEffect, useState, ReactNode } from 'react';

export default function ClientOnly({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // или <div>Загрузка...</div>
  }

  return <>{children}</>;
}