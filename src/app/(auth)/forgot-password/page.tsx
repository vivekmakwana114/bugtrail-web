import type { Metadata } from 'next';
import { RedirectIfAuthenticated } from '@/components/auth/guards';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = { title: 'Reset password · BugTrail' };

export default function ForgotPasswordPage() {
  return (
    <RedirectIfAuthenticated>
      <ForgotPasswordForm />
    </RedirectIfAuthenticated>
  );
}
