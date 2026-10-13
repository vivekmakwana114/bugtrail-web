'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/api-client';
import { FormAlert } from './form-alert';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A question: "Delete CHK-42?", "Suspend Riya Shah?" */
  title: string;
  /** What will happen, in plain words, including whether it can be undone. */
  description: ReactNode;
  /** A verb for the action: "Delete bug", "Suspend". Never "OK" or "Yes". */
  confirmLabel: string;
  /** danger for destructive actions (delete, reject, suspend); primary otherwise. */
  tone?: 'danger' | 'primary';
  /** Do the thing. Throwing shows the API's message in the dialog and keeps it open. */
  onConfirm: () => Promise<void>;
};

/**
 * "Are you sure?" for one action. While it runs the buttons are disabled and Escape is ignored;
 * if it fails, the API's reason ("This is the last active Admin…") is shown right here, so the
 * person can read it and decide what to do instead.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const change = (next: boolean) => {
    if (pending) return;
    if (!next) setError(undefined);
    onOpenChange(next);
  };

  const confirm = async () => {
    setPending(true);
    setError(undefined);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent title={title} description={description} size="sm">
        {error && <FormAlert>{error}</FormAlert>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => change(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone} onClick={confirm} disabled={pending}>
            {pending ? `${confirmLabel}…` : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
