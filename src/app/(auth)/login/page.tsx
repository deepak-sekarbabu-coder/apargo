import Image from 'next/image';

import { LoginForm } from '@/components/login-form';
import { ThemeSwitch } from '@/components/ui/theme-switch';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Theme switcher fixed near top-right within page bounds */}
      <div className="absolute right-4 top-4">
        <ThemeSwitch />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <Image
            src="/apargo-logo.png"
            alt="Apargo Logo"
            width={48}
            height={48}
            className="object-contain rounded bg-white mb-2"
            priority
            unoptimized
          />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Apargo</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
