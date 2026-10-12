'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { FormAlert } from '@/components/shared/form-alert';
import { routes } from '@/config/routes';
import { getErrorMessage } from '@/lib/api-client';
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

  const onDelete = async () => {
    try {
      await deleteBug.mutateAsync();
      toast.success(`${bug.key} deleted`);
      router.replace(routes.project(bug.project.id));
    } catch {
      // Shown in the dialog below (deleteBug.error).
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (deleteBug.isPending) return;
        if (!next) deleteBug.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        title={`Delete ${bug.key}?`}
        size="sm"
        description={`It disappears from the grid, the counts and the dashboard. Its history stays in the database and ${bug.key} is never reused. There's no undo in the app.`}
      >
        {deleteBug.isError && <FormAlert>{getErrorMessage(deleteBug.error)}</FormAlert>}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteBug.isPending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleteBug.isPending}>
            {deleteBug.isPending ? 'Deleting…' : 'Delete bug'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
