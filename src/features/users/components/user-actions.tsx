'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermission } from '@/components/auth/can';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useDeleteUser, useSetUserStatus } from '../hooks';
import type { UserListItem } from '../types';
import { RoleDialog } from './role-dialog';

type Dialog = 'approve' | 'change-role' | 'reject' | 'suspend' | 'reactivate' | 'delete';

/**
 * The ⋯ menu on a user row. Only actions that make sense for this user's status AND that your role
 * allows are listed; the API enforces both again (and the last-Admin and has-bugs rules, whose
 * messages show in the confirm dialog).
 */
export function UserActions({ user }: { user: UserListItem }) {
  const canApprove = usePermission('user:approve');
  const canUpdate = usePermission('user:update');
  const canDelete = usePermission('user:delete');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const setStatus = useSetUserStatus();
  const deleteUser = useDeleteUser();
  const onOpenChange = (open: boolean) => !open && setDialog(null);

  const items: { id: Dialog; label: string; danger?: boolean }[] = [];
  if (canApprove && (user.status === 'pending' || user.status === 'rejected')) {
    items.push({ id: 'approve', label: 'Approve…' });
  }
  if (canApprove && user.status === 'pending')
    items.push({ id: 'reject', label: 'Reject…', danger: true });
  if (canUpdate && (user.status === 'active' || user.status === 'suspended')) {
    items.push({ id: 'change-role', label: 'Change role…' });
  }
  if (canApprove && user.status === 'suspended')
    items.push({ id: 'reactivate', label: 'Reactivate…' });
  if (canApprove && user.status === 'active')
    items.push({ id: 'suspend', label: 'Suspend…', danger: true });
  if (canDelete) items.push({ id: 'delete', label: 'Delete…', danger: true });
  if (items.length === 0) return null;

  const firstDanger = items.findIndex((item) => item.danger);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={`Actions for ${user.name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {items.map((item, i) => [
            i === firstDanger && i > 0 && <DropdownMenuSeparator key={`sep-${item.id}`} />,
            <DropdownMenuItem
              key={item.id}
              tone={item.danger ? 'danger' : 'default'}
              onSelect={() => setDialog(item.id)}
            >
              {item.label}
            </DropdownMenuItem>,
          ])}
        </DropdownMenuContent>
      </DropdownMenu>

      <RoleDialog
        user={user}
        mode={dialog === 'change-role' ? 'change' : 'approve'}
        open={dialog === 'approve' || dialog === 'change-role'}
        onOpenChange={onOpenChange}
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onOpenChange={onOpenChange}
        title={`Reject ${user.name}?`}
        description={`${user.email} gets an email saying the request was declined. You can still approve them later from All users.`}
        confirmLabel="Reject"
        onConfirm={async () => {
          await setStatus.mutateAsync({ userId: user.id, status: 'rejected' });
          toast.success(`${user.name} rejected`);
        }}
      />
      <ConfirmDialog
        open={dialog === 'suspend'}
        onOpenChange={onOpenChange}
        title={`Suspend ${user.name}?`}
        description="They're signed out everywhere at once and can't sign in until reactivated. Their bugs, messages and history stay as they are."
        confirmLabel="Suspend"
        onConfirm={async () => {
          await setStatus.mutateAsync({ userId: user.id, status: 'suspended' });
          toast.success(`${user.name} suspended`);
        }}
      />
      <ConfirmDialog
        open={dialog === 'reactivate'}
        onOpenChange={onOpenChange}
        title={`Reactivate ${user.name}?`}
        description="They can sign in again with the role they had, and get an email saying so."
        confirmLabel="Reactivate"
        tone="primary"
        onConfirm={async () => {
          await setStatus.mutateAsync({ userId: user.id, status: 'active' });
          toast.success(`${user.name} reactivated`);
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={onOpenChange}
        title={`Delete ${user.name}?`}
        description="The account is removed for good and they're taken off every project. Anyone who has reported or been assigned bugs can't be deleted (their name is part of the history): suspend them instead."
        confirmLabel="Delete user"
        onConfirm={async () => {
          await deleteUser.mutateAsync(user.id);
          toast.success(`${user.name} deleted`);
        }}
      />
    </>
  );
}
