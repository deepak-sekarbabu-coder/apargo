'use client';

import { useAuth } from '@/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import { AccessibleField, ScreenReaderAnnouncement } from '@/components/ui/accessibility';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { useToast } from '@/hooks/use-toast';

import { InstallButton } from '../ui/install-button';

// Updated import path

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Google</title>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.73 1.9-3.87 0-7-3.13-7-7s3.13-7 7-7c1.93 0 3.61.79 4.81 1.9l2.43-2.42C19.64.29 16.7.0 12.48.0 5.88.0.42 5.21.42 12s5.46 12 12.06 12c3.29 0 6.08-1.09 8.16-3.21 2.25-2.25 2.88-5.77 2.88-8.53 0-.63-.06-1.25-.16-1.84H12.48z" />
  </svg>
);

export function LoginForm() {
  const { toast } = useToast();
  const { login, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      // Don't manually redirect - let the auth context handle it
    } catch (error) {
      const errorMessage = (error as Error).message;
      toast({
        title: 'Login Failed',
        description: errorMessage,
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Don't manually redirect - let the auth context handle it
    } catch (error) {
      toast({
        title: 'Google Sign-In Failed',
        description: (error as Error).message,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      <ScreenReaderAnnouncement
        message={
          isLoading
            ? 'Logging in, please wait...'
            : isGoogleLoading
              ? 'Signing in with Google, please wait...'
              : ''
        }
        priority="polite"
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-8 pb-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <AccessibleField
                id="email"
                label="Email"
                error={fieldState.error?.message}
                required
                description="Enter your registered email address"
              >
                <Input
                  placeholder="name@example.com"
                  {...field}
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                />
              </AccessibleField>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <AccessibleField
                id="password"
                label="Password"
                error={fieldState.error?.message}
                required
                description="Enter your account password"
              >
                <Input type="password" placeholder="••••••••" {...field} />
              </AccessibleField>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner className="w-4 h-4" /> Logging in...
              </span>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </Form>
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="grid gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
        <InstallButton />
      </div>
    </>
  );
}
