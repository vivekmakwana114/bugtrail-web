'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/ui/field';
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

type RoleDialogProps = {
  user: UserListItem;
  /** approve: activate a pending or rejected user with a role. change: an active/suspended user's role. */
  mode: 'approve' | 'change';
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Pick a role: to approve someone (they're emailed and can sign in at once) or to change an
 * existing user's role (their access changes immediately; live connections are dropped and rejoin).
 */
export function RoleDialog({ user, mode, open, onOpenChange }: RoleDialogProps) {
  const setStatus = useSetUserStatus();
  const changeRole = useChangeUserRole();
  // undefined = not picked yet: show the user's current role (if any).
  const [picked, setPicked] = useState<RoleKey>();
  const role = picked ?? user.role ?? undefined;
  const [error, setError] = useState<string>();
  const pending = setStatus.isPending || changeRole.isPending;

  const close = (next: boolean) => {
    if (!next) {
      setPicked(undefined);
      setError(undefined);
    }
    onOpenChange(next);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!role) return setError('Pick a role first.');
    if (mode === 'change' && role === user.role) return close(false);
    setError(undefined);
    try {
      if (mode === 'approve') {
        await setStatus.mutateAsync({ userId: user.id, status: 'active', role });
        toast.success(`${user.name} approved as ${ROLE_LABELS[role]}`, {
          description: 'They got an email and can sign in now.',
        });
      } else {
        await changeRole.mutateAsync({ userId: user.id, role });
        toast.success(`${user.name} is now ${ROLE_LABELS[role]}`);
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
      title={mode === 'approve' ? `Approve ${user.name}` : `Change ${user.name}'s role`}
      description={
        mode === 'approve'
          ? `${user.email} gets an email and can sign in right away with this role.`
          : 'Their access changes immediately, on every open tab.'
      }
      submitLabel={mode === 'approve' ? 'Approve' : 'Change role'}
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
    </FormDialog>
  );
}
