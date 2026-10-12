'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { FormAlert } from '@/components/shared/form-alert';
import { routes } from '@/config/routes';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import * as authApi from '../api';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { AuthCard, linkClasses } from './auth-card';

/**
 * Choose a new password from the emailed link (/reset-password?token=...). Resetting signs out
 * every session, then we send the user to sign in with the new password.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  const requestNewLink = (
    <Link href={routes.forgotPassword} className={linkClasses}>
      Request a new link
    </Link>
  );

  if (!token) {
    return (
      <AuthCard title="This link is incomplete" footer={requestNewLink}>
        <p className="text-sm text-ink-2">
          The reset link is missing part of its address. Open it again from the email, or request a
          new one.
        </p>
      </AuthCard>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ token, password });
      router.replace(`${routes.login}?notice=password-reset`);
    } catch (error) {
      setFormError(
        getErrorStatus(error) === 401
          ? 'This link has expired or was already used. Request a new one.'
          : getErrorMessage(error),
      );
    }
  });

  return (
    <AuthCard
      title="Choose a new password"
      description="You'll be signed out everywhere else."
      footer={requestNewLink}
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field
          id="password"
          label="New password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>
        <Field id="confirm" label="Type it again" error={errors.confirm?.message}>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            aria-invalid={!!errors.confirm}
            {...register('confirm')}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="justify-self-end"
        >
          {isSubmitting ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </AuthCard>
  );
}
