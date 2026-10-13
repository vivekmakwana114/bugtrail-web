'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { routes } from '@/config/routes';
import { useDeleteBug } from '../hooks';
import type { BugDetail } from '../types';

type DeleteBugDialogProps = {
  bug: BugDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Admin only (bug:delete). A soft delete: gone from lists and counts, history kept. */
export function DeleteBugDialog({ bug, open, onOpenChange }: DeleteBugDialogProps) {
  const router = useRouter();
  const deleteBug = useDeleteBug(bug);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${bug.key}?`}
      description={`It disappears from the grid, the counts and the dashboard. Its history stays in the database and ${bug.key} is never reused. There's no undo in the app.`}
      confirmLabel="Delete bug"
      onConfirm={async () => {
        await deleteBug.mutateAsync();
        toast.success(`${bug.key} deleted`);
        router.replace(routes.project(bug.project.id));
      }}
    />
  );
}
