import type { BugStatus } from '@/types/api';
import { STATUS_BADGE, STATUS_META } from '@/config/statuses';
import { cn } from '@/lib/utils';
import { StatusGlyph } from './status-glyph';

/** Glyph + label on a faint tint of the status colour. The label stays ink for contrast. */
export function StatusBadge({ status, className }: { status: BugStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border py-0.5 pr-2 pl-1.5 text-sm font-medium whitespace-nowrap text-ink',
        STATUS_BADGE[status],
        className,
      )}
    >
      <StatusGlyph status={status} />
      {STATUS_META[status].label}
    </span>
  );
}
