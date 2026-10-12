import { cn } from '@/lib/utils';
import type { UserStatus } from '../types';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Waiting for approval',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
};

/*
 * A dot and a word, deliberately quieter than the bug status badges: account state is
 * secondary information on this screen. Classes are written out in full for Tailwind.
 */
const DOT: Record<UserStatus, string> = {
  pending: 'bg-ongoing',
  active: 'bg-pass',
  suspended: 'bg-danger',
  rejected: 'bg-line-strong',
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-ink-2">
      <span className={cn('size-2 rounded-full', DOT[status])} aria-hidden />
      {USER_STATUS_LABELS[status]}
    </span>
  );
}
