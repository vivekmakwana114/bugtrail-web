import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Plain table elements with the grid's look: dense rows, hairlines, mono for machine values.
 * The ticket grid, the dashboard and the users list all use these directly (no table library).
 *
 * The frame scrolls sideways when the table is wider than the screen. It's `relative` so that
 * absolutely positioned bits inside cells (an `sr-only` label, for one) are clipped by the frame;
 * otherwise they're placed against the page and can make the whole page scroll sideways.
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="relative overflow-x-auto rounded-md border border-line bg-surface">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-line px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-ink-3',
        className,
      )}
      {...props}
    />
  );
}

/** `selected` marks the keyboard cursor row with an ink edge, not a colour. */
export function TableRow({
  className,
  selected,
  ...props
}: ComponentProps<'tr'> & { selected?: boolean }) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={cn(
        'border-b border-line last:border-b-0 hover:bg-ink/3',
        selected && 'bg-ink/6 [&>td:first-child]:shadow-cursor',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('px-3 py-2.5 align-middle', className)} {...props} />;
}
