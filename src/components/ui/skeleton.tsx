import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** Loading placeholder. Shape it like the content it replaces (a row, a card), never a spinner. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-sm bg-sunken motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
