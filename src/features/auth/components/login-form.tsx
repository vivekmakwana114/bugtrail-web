'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { FormAlert } from '@/components/shared/form-alert';
import { routes } from '@/config/routes';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import * as authApi from '../api';
import { loginSchema, type LoginValues } from '../schemas';
import { AuthCard, linkClasses } from './auth-card';

/** Notices other screens can hand to the login page via ?notice= */
const NOTICES: Record<string, string> = {
  'password-reset': 'Your password is changed. Sign in with the new one.',
};

/**
 * Sign in. On success it only calls signIn(): RedirectIfAuthenticated then sends the user on to
 * ?next= (or the home page), so navigation after sign-in lives in one place.
 */
export function LoginForm() {
  const { signIn } = useAuth();
  const notice = NOTICES[useSearchParams().get('notice') ?? ''];
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      signIn(await authApi.login(values));
    } catch (error) {
      // 401: wrong email or password (deliberately not saying which).
      // 403: right password, but the account is pending, suspended or rejected: the API says which.
      setFormError(
        getErrorStatus(error) === 401
          ? 'That email and password combination is not right. Check both and try again.'
          : getErrorMessage(error),
      );
    }
  });

  return (
    <AuthCard
      title="Sign in"
      footer={
        <>
          New to BugTrail?{' '}
          <Link href={routes.register} className={linkClasses}>
            Request access
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {notice && <FormAlert tone="success">{notice}</FormAlert>}
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={routes.forgotPassword}
            className="text-sm text-ink-2 underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
