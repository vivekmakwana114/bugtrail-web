import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FormAlertProps = {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
  className?: string;
};

/**
 * A form-level message: an API error, or a confirmation ("Password changed"). Errors use
 * role="alert" so screen readers announce them; the others are polite status messages.
 */
export function FormAlert({ tone = 'error', children, className }: FormAlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-sm border px-3 py-2 text-sm text-ink',
        tone === 'error' && 'border-danger/40 bg-danger/10',
        tone === 'success' && 'border-pass/40 bg-pass/10',
        tone === 'info' && 'border-line-strong bg-sunken',
        className,
      )}
    >
      {children}
    </div>
  );
}
