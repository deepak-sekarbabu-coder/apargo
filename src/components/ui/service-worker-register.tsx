'use client';

import { useEffect } from 'react';

import { registerServiceWorker } from '@/lib/push-notifications';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
