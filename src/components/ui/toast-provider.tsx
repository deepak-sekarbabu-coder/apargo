'use client';

import { Toaster } from '@/components/ui/toaster';

// Assuming this is the ShadCN Toaster component
// The useToast hook is not directly used in the provider, but by components that trigger toasts.

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  // The Toaster component from ShadCN UI handles rendering all toasts
  // that are managed by the useToast hook.
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
