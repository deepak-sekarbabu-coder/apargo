'use client';

import { Download } from 'lucide-react';

import { useDeviceInfo } from '@/hooks/use-mobile';

import { Button } from './button';
import { usePWAInstall } from './pwa-features';

export function InstallButton() {
  const { isMobile } = useDeviceInfo();
  const { isInstallable, installApp } = usePWAInstall();

  if (!isInstallable || !isMobile) {
    return null;
  }

  return (
    <Button variant="outline" onClick={installApp} className="w-full">
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
