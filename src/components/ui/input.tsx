import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Shared by every text-like control, so inputs, textareas and selects match. */
export const controlClasses =
  'w-full rounded-sm border border-line-strong bg-surface px-2.5 text-sm text-ink placeholder:text-ink-3 disabled:opacity-50 aria-invalid:border-danger';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(controlClasses, 'h-8', className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      rows={rows}
      className={cn(controlClasses, 'py-1.5 leading-5', className)}
      {...props}
    />
  );
}
