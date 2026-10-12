import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata: Metadata = { title: 'Choose a new password · BugTrail' };

/**
 * No RedirectIfAuthenticated here: a reset link must work even if this browser is signed in
 * (someone resetting a password they think was stolen, for example).
 */
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
