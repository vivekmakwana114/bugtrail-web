import type { ReactNode } from 'react';
import { Label } from 'radix-ui';
import { cn } from '@/lib/utils';

type FieldProps = {
  /** id of the control inside, for the label's htmlFor */
  id: string;
  label: string;
  hint?: ReactNode;
  /** Shown instead of the hint; give the control aria-invalid too. */
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint or error. Every form field uses this, so they all line up. */
export function Field({ id, label, hint, error, className, children }: FieldProps) {
  return (
    // content-start: in a row of fields, one with a hint mustn't push its neighbour's control down.
    <div className={cn('grid content-start gap-1', className)}>
      <Label.Root htmlFor={id} className="text-xs font-medium text-ink-2">
        {label}
      </Label.Root>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
