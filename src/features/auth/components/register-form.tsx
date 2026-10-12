'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { FormAlert } from '@/components/shared/form-alert';
import { routes } from '@/config/routes';
import { getErrorMessage } from '@/lib/api-client';
import * as authApi from '../api';
import { registerSchema, type RegisterValues } from '../schemas';
import { AuthCard, linkClasses } from './auth-card';

/**
 * Self-registration. The account starts "pending": an admin approves it with a role
 * (Developer, QA, Project Manager) before the person can sign in.
 */
export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.register(values);
      router.push(routes.pendingApproval);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <AuthCard
      title="Request access"
      description="An admin reviews new accounts and gives you a role. You can sign in once it's approved."
      footer={
        <>
          Already approved?{' '}
          <Link href={routes.login} className={linkClasses}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            autoFocus
            aria-invalid={!!errors.name}
            {...register('name')}
          />
        </Field>
        <Field id="email" label="Work email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="justify-self-end"
        >
          {isSubmitting ? 'Sending request…' : 'Request access'}
        </Button>
      </form>
    </AuthCard>
  );
}
