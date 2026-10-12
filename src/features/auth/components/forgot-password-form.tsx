'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FormAlert } from '@/components/shared/form-alert';
import { routes } from '@/config/routes';
import { getErrorMessage } from '@/lib/api-client';
import * as authApi from '../api';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';
import { AuthCard, linkClasses } from './auth-card';

/**
 * Ask for a reset link. The confirmation never says whether the email has an account (the API
 * always answers the same way), so nobody can use this page to find out who works here.
 */
export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.forgotPassword(values);
      setSentTo(values.email);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  const backToSignIn = (
    <Link href={routes.login} className={linkClasses}>
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthCard title="Check your email" footer={backToSignIn}>
        <p className="text-sm text-ink-2">
          If <span className="font-medium text-ink">{sentTo}</span> has a BugTrail account, a reset
          link is on its way. It only works for a short time, so use it soon. Nothing arrived after
          a few minutes? Check spam, or ask your admin.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your work email and we'll send you a link to choose a new password."
      footer={backToSignIn}
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field id="email" label="Work email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="justify-self-end"
        >
          {isSubmitting ? 'Sending link…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  );
}
