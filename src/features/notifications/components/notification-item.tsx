import type { ReactNode } from 'react';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AppNotification } from '../types';

type NotificationItemProps = {
  notification: AppNotification;
  /** Clicking the row: mark it read and follow its link. */
  onOpen: (notification: AppNotification) => void;
  /** A button beside the row (e.g. "Mark read"); kept outside the row's own button. */
  action?: ReactNode;
};

/**
 * One notification, used by the bell and the notifications page so both read the same.
 * Unread is a dot plus bold title (and "(unread)" for screen readers), never colour alone.
 */
export function NotificationItem({ notification, onOpen, action }: NotificationItemProps) {
  const unread = !notification.readAt;
  return (
    <li className="flex items-start hover:bg-sunken">
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="grid min-w-0 flex-1 grid-cols-[0.5rem_1fr] gap-x-2.5 px-3 py-2 text-left"
      >
        <span aria-hidden className={cn('mt-1.5 size-1.5 rounded-full', unread && 'bg-ink')} />
        <span className="grid min-w-0 gap-0.5">
          <span className={cn('text-sm', unread && 'font-semibold')}>
            {notification.title}
            {unread && <span className="sr-only"> (unread)</span>}
          </span>
          {notification.message && (
            <span className="line-clamp-2 text-xs text-ink-2">{notification.message}</span>
          )}
          <time
            dateTime={notification.createdAt}
            title={formatDateTime(notification.createdAt)}
            className="font-mono text-xs text-ink-3"
          >
            {formatRelative(notification.createdAt)}
          </time>
        </span>
      </button>
      {action && <div className="shrink-0 py-1.5 pr-2">{action}</div>}
    </li>
  );
}
