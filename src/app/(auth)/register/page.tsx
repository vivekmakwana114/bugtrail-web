import type { Metadata } from 'next';
import { RedirectIfAuthenticated } from '@/components/auth/guards';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Request access · BugTrail' };

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <RegisterForm />
    </RedirectIfAuthenticated>
  );
}
