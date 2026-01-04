'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/plan');
    }
  }, [user, isUserLoading, router]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Inicia sesión en tu cuenta
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
