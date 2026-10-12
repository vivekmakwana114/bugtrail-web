import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RedirectIfAuthenticated } from '@/components/auth/guards';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Sign in · BugTrail' };

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      {/* LoginForm reads ?notice= from the URL, which needs a Suspense boundary when prerendered. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </RedirectIfAuthenticated>
  );
}
