import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** A keyboard key, for shortcut hints: <Kbd>c</Kbd> */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-b-2 border-line-strong px-1 font-mono text-xs leading-none text-ink-2',
        className,
      )}
      {...props}
    />
  );
}
