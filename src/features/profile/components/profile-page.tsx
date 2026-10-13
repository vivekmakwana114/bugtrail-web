'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { usePermission } from '@/components/auth/can';
import { FormAlert } from '@/components/shared/form-alert';
import { PageHeader } from '@/components/shared/page-header';
import { roleLabel, ROLE_DESCRIPTIONS } from '@/config/roles';
import { routes } from '@/config/routes';
import * as authApi from '@/features/auth/api';
import { changePasswordSchema, type ChangePasswordValues } from '@/features/auth/schemas';
import type { SessionUser } from '@/features/auth/types';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import * as profileApi from '../api';
import { profileSchema, type ProfileValues } from '../schemas';

/**
 * Your own account: what it is (read-only facts), how you appear to others (name, picture),
 * and your password. Email and role belong to an Admin, so they're shown, not edited.
 */
export function ProfilePage() {
  const { user } = useAuth();
  // The panel layout only renders pages once the session is known, so this is a formality.
  if (!user) return null;

  return (
    // A reading width: this is a form, and long inputs are harder to scan.
    <div className="grid max-w-3xl gap-5">
      <PageHeader title="Profile" description="How you appear to your team, and your password." />
      <AccountSection user={user} />
      <ProfileForm user={user} />
      <PasswordForm email={user.email} />
    </div>
  );
}

function ProfileSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid min-w-0 gap-4 rounded-md border border-line bg-surface p-4 sm:p-5"
    >
      <div className="grid gap-0.5">
        <h2 id={id} className="text-md font-semibold">
          {title}
        </h2>
        {note && <p className="text-xs text-ink-3">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ account facts */

function AccountSection({ user }: { user: SessionUser }) {
  const canSeeRoles = usePermission('user:read');
  return (
    <ProfileSection id="account" title="Account" note="Only an Admin can change these.">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[10rem_1fr]">
        <Fact label="Email">
          <span className="break-all">{user.email}</span>
        </Fact>
        <Fact label="Role">
          <span className="font-medium">{roleLabel(user.role)}</span>
          {user.role && <span className="block text-ink-2">{ROLE_DESCRIPTIONS[user.role]}</span>}
          {canSeeRoles && (
            <Link
              href={routes.roles}
              className="mt-1 inline-block text-ink underline underline-offset-2 hover:no-underline"
            >
              What each role can do
            </Link>
          )}
        </Fact>
        <Fact label="Member since">
          <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
        </Fact>
        <Fact label="Last sign-in">
          {user.lastLoginAt ? (
            <time dateTime={user.lastLoginAt} title={formatDateTime(user.lastLoginAt)}>
              {formatRelative(user.lastLoginAt)}
            </time>
          ) : (
            <span className="text-ink-3">Not recorded yet</span>
          )}
        </Fact>
      </dl>
    </ProfileSection>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:contents">
      <dt className="text-xs font-medium text-ink-3 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ name and picture */

function ProfileForm({ user }: { user: SessionUser }) {
  const { reloadUser } = useAuth();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, avatarUrl: user.avatarUrl ?? '' },
  });

  // useWatch, not watch(): the React Compiler can't memoise a component that calls watch().
  const name = useWatch({ control, name: 'name' });
  const avatarUrl = useWatch({ control, name: 'avatarUrl' }).trim();
  // Preview only something that could be a link; a half-typed URL would just flash a broken load.
  const previewSrc = /^https?:\/\/\S+\.\S+/i.test(avatarUrl) ? avatarUrl : null;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await profileApi.updateMe({ name: values.name, avatarUrl: values.avatarUrl || null });
      await reloadUser(); // the top bar shows the new name and picture straight away
      // Your name and picture are inside cached lists (members, users, bugs, chat); refetch
      // whatever is on screen so nothing shows the old ones. Profile edits are rare, so a
      // broad invalidation is cheaper than tracking every place a user appears.
      await queryClient.invalidateQueries();
      reset({ name: values.name, avatarUrl: values.avatarUrl });
      toast.success('Profile saved');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <ProfileSection
      id="profile"
      title="Profile"
      note="Your name and picture appear on bugs, chat and member lists."
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {formError && <FormAlert>{formError}</FormAlert>}
        <div className="flex items-center gap-4">
          <Avatar name={name.trim() || user.name} src={previewSrc} size="lg" />
          <p className="text-xs text-ink-3">
            {avatarUrl
              ? 'Preview. If it still shows your initials, the picture link didn’t load.'
              : 'No picture, so your initials are shown.'}
          </p>
        </div>
        <Field id="name" label="Name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field
          id="avatarUrl"
          label="Picture link (optional)"
          hint="A direct link to an image (https://…/photo.jpg). Google Drive share links open a page, not the image, so they won't show."
          error={errors.avatarUrl?.message}
        >
          <div className="flex gap-2">
            <Input
              id="avatarUrl"
              type="url"
              inputMode="url"
              placeholder="https://"
              aria-invalid={!!errors.avatarUrl}
              className="min-w-0 flex-1"
              {...register('avatarUrl')}
            />
            {avatarUrl && (
              <Button
                variant="ghost"
                onClick={() =>
                  setValue('avatarUrl', '', { shouldDirty: true, shouldValidate: true })
                }
              >
                Remove
              </Button>
            )}
          </div>
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty || isSubmitting}
          className="justify-self-end"
        >
          {isSubmitting ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </ProfileSection>
  );
}

/* ------------------------------------------------------------------ password */

function PasswordForm({ email }: { email: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFormError(null);
    setChanged(false);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      reset({ currentPassword: '', newPassword: '', confirm: '' });
      setChanged(true);
    } catch (error) {
      const message = getErrorMessage(error);
      // The one mistake worth pinning to its field: the API checked the current password.
      if (getErrorStatus(error) === 400 && /current password/i.test(message)) {
        setError(
          'currentPassword',
          { message: 'That isn’t your current password.' },
          { shouldFocus: true },
        );
      } else {
        setFormError(message);
      }
    }
  });

  return (
    <ProfileSection
      id="password"
      title="Password"
      note="Changing it signs you out on every other device. You stay signed in here."
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        {changed && (
          <FormAlert tone="success">
            Password changed. Any other device you were signed in on will ask you to sign in again.
          </FormAlert>
        )}
        {formError && <FormAlert>{formError}</FormAlert>}
        {/* Lets password managers file the new password under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <Field
          id="currentPassword"
          label="Current password"
          error={errors.currentPassword?.message}
        >
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="newPassword"
            label="New password"
            hint="At least 8 characters, with a letter and a number."
            error={errors.newPassword?.message}
          >
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...register('newPassword')}
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
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="justify-self-end"
        >
          {isSubmitting ? 'Changing…' : 'Change password'}
        </Button>
      </form>
    </ProfileSection>
  );
}
