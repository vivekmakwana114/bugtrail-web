'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormDialog } from '@/components/templates/form-dialog';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/config/roles';
import { getErrorMessage } from '@/lib/api-client';
import type { RoleKey } from '@/types/api';
import { useChangeUserRole, useSetUserStatus } from '../hooks';
import type { UserListItem } from '../types';

const roleOptions = (Object.keys(ROLE_LABELS) as RoleKey[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

/** Same limit as the API (user.validation.js). */
export const DESIGNATION_MAX = 100;

type RoleDialogProps = {
  user: UserListItem;
  /** approve: activate a pending or rejected user with a role. change: an active/suspended user's role. */
  mode: 'approve' | 'change';
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Pick a role and, optionally, a designation (free-text job title such as "MERN Developer"):
 * to approve someone (they're emailed and can sign in at once) or to change an existing user's
 * role (their access changes immediately; live connections are dropped and rejoin). The
 * designation is descriptive only: the role alone decides what they can do.
 */
export function RoleDialog({ user, mode, open, onOpenChange }: RoleDialogProps) {
  const setStatus = useSetUserStatus();
  const changeRole = useChangeUserRole();
  // undefined = not touched yet: show the user's current role and designation.
  const [picked, setPicked] = useState<RoleKey>();
  const [typed, setTyped] = useState<string>();
  const role = picked ?? user.role ?? undefined;
  const designation = typed ?? user.designation;
  const [error, setError] = useState<string>();
  const pending = setStatus.isPending || changeRole.isPending;

  const close = (next: boolean) => {
    if (!next) {
      setPicked(undefined);
      setTyped(undefined);
      setError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!role) return setError('Pick a role first.');
    const title = designation.trim();
    if (mode === 'change' && role === user.role && title === user.designation) return close(false);
    setError(undefined);
    try {
      if (mode === 'approve') {
        await setStatus.mutateAsync({
          userId: user.id,
          status: 'active',
          role,
          designation: title,
        });
        toast.success(`${user.name} approved as ${ROLE_LABELS[role]}`, {
          description: 'They got an email and can sign in now.',
        });
      } else {
        await changeRole.mutateAsync({ userId: user.id, role, designation: title });
        toast.success(
          role === user.role
            ? `${user.name}'s designation is saved`
            : `${user.name} is now ${ROLE_LABELS[role]}`,
        );
      }
      close(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={close}
      title={mode === 'approve' ? `Approve ${user.name}` : `${user.name}'s role`}
      description={
        mode === 'approve'
          ? `${user.email} gets an email and can sign in right away with this role.`
          : 'A role change applies immediately, on every open tab.'
      }
      submitLabel={mode === 'approve' ? 'Approve' : 'Save'}
      size="sm"
      pending={pending}
      error={error}
      onSubmit={onSubmit}
    >
      {/* What the role can do, so the approver picks with the consequences in view. */}
      <Field id="user-role" label="Role" hint={role ? ROLE_DESCRIPTIONS[role] : undefined}>
        <Select
          id="user-role"
          value={role}
          placeholder="Choose a role…"
          onValueChange={(value) => setPicked(value as RoleKey)}
          options={roleOptions}
        />
      </Field>
      <Field
        id="user-designation"
        label="Designation (optional)"
        hint="Their job title, shown next to the role, e.g. MERN Developer, Flutter Developer."
      >
        <Input
          id="user-designation"
          value={designation}
          maxLength={DESIGNATION_MAX}
          placeholder="MERN Developer"
          onChange={(event) => setTyped(event.target.value)}
        />
      </Field>
    </FormDialog>
  );
}
