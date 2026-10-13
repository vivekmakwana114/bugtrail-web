'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Select } from '@/components/ui/select';
import { FormDialog } from '@/components/templates/form-dialog';
import { ROLE_LABELS } from '@/config/roles';
import { email, newPassword } from '@/features/auth/schemas';
import { getErrorMessage } from '@/lib/api-client';
import type { RoleKey } from '@/types/api';
import { useCreateUser } from '../hooks';

const roles = Object.keys(ROLE_LABELS) as [RoleKey, ...RoleKey[]];

/* Same rules as sign-up (and as the API): one source for email and password checks. */
const addUserSchema = z.object({
  name: z.string().trim().min(1, 'Enter their name.').max(100, 'Keep it under 100 characters.'),
  email,
  role: z.enum(roles, { message: 'Pick a role.' }),
  password: newPassword,
});
type AddUserValues = z.infer<typeof addUserSchema>;

type AddUserDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Admin creates an account directly (user:create): active at once, no approval queue. The Admin
 * sets a first password and shares it; the person can change it from their profile.
 */
export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const createUser = useCreateUser();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddUserValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const close = (next: boolean) => {
    if (!next) {
      reset();
      setFormError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await createUser.mutateAsync(values);
      toast.success(`${values.name} added as ${ROLE_LABELS[values.role]}`, {
        description: 'Share the password with them; they can sign in now.',
      });
      close(false);
    } catch (error) {
      const message = getErrorMessage(error);
      if (/email/i.test(message)) setError('email', { message });
      else setFormError(message);
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title="Add user"
      description="The account is active straight away. No approval needed."
      submitLabel="Add user"
      pending={createUser.isPending}
      error={formError}
      onSubmit={onSubmit}
    >
      <Field id="new-user-name" label="Name" error={errors.name?.message}>
        <Input id="new-user-name" autoFocus aria-invalid={!!errors.name} {...register('name')} />
      </Field>
      <Field id="new-user-email" label="Email" error={errors.email?.message}>
        <Input
          id="new-user-email"
          type="email"
          autoComplete="off"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
      </Field>
      <Field id="new-user-role" label="Role" error={errors.role?.message}>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select
              id="new-user-role"
              value={field.value}
              placeholder="Choose a role…"
              onValueChange={field.onChange}
              options={roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
              aria-invalid={!!errors.role}
            />
          )}
        />
      </Field>
      <Field
        id="new-user-password"
        label="First password"
        hint="At least 8 characters with a letter and a number. They can change it later."
        error={errors.password?.message}
      >
        <PasswordInput
          id="new-user-password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
      </Field>
    </FormDialog>
  );
}
