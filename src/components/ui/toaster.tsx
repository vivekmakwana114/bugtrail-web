'use client';

import { Toaster as Sonner } from 'sonner';

/**
 * Toasts confirm what just happened ("Bug reported", "Moved to Resolved"). Styled with tokens;
 * errors get the danger colour, everything else stays neutral.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-89 items-start gap-2.5 rounded-md border border-line-strong bg-surface px-3.5 py-3 text-sm text-ink shadow-pop',
          title: 'font-medium',
          description: 'text-xs text-ink-2',
          error: 'border-danger/50 [&_[data-icon]]:text-danger',
          actionButton: 'ml-auto rounded-sm bg-ink px-2 py-1 text-xs font-medium text-bg',
          cancelButton: 'ml-auto rounded-sm px-2 py-1 text-xs text-ink-2',
        },
      }}
    />
  );
}
