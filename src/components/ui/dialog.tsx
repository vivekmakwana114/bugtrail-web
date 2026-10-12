'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  /** One line under the title. Omit it rather than repeating the title. */
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

/**
 * A dialog always has a visible title (also its accessible name) and a close button.
 * Focus is trapped inside and returns to the trigger on close (Radix).
 */
export function DialogContent({
  title,
  description,
  size = 'md',
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/30" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-[12vh] left-1/2 z-50 grid max-h-[80vh] w-[calc(100vw-2rem)] -translate-x-1/2 gap-4 overflow-y-auto rounded-md border border-line-strong bg-surface p-5 shadow-pop',
          size === 'sm' && 'max-w-sm',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-2xl',
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div className="grid gap-1 pr-8">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-sm text-ink-2">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        {children}
        <DialogPrimitive.Close
          className="absolute top-4 right-4 grid size-7 place-items-center rounded-sm text-ink-3 hover:bg-sunken hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Right-aligned row of actions at the bottom of a dialog: secondary first, primary last. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-wrap justify-end gap-2 border-t border-line pt-4', className)}
      {...props}
    />
  );
}
