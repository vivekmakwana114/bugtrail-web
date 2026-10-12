'use client';

import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** A verb: "Report bug", "Add members". Never "Submit" or "OK". */
  submitLabel: string;
  /** While saving: disables the form's buttons and shows "<submitLabel>…". */
  pending?: boolean;
  /** Form-level error from the API (field errors go next to their fields). */
  error?: string;
  /** Extra controls on the footer's left, e.g. the "Send email" checkbox. */
  footerStart?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

/**
 * Template for every create/edit dialog (report bug, add members, approve user).
 * Enter submits, Escape cancels, focus starts on the first field (Radix).
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  pending = false,
  error,
  footerStart,
  size = 'md',
  onSubmit,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent title={title} description={description} size={size}>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <fieldset disabled={pending} className="grid gap-4">
            {children}
          </fieldset>
          {error && (
            <p
              role="alert"
              className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-ink"
            >
              {error}
            </p>
          )}
          <DialogFooter className="items-center">
            {footerStart && <div className="mr-auto">{footerStart}</div>}
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? `${submitLabel}…` : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
