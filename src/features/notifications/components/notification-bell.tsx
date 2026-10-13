'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Popover } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { useMarkAllRead, useMarkRead, useRecentNotifications, useUnreadCount } from '../hooks';
import type { AppNotification } from '../types';
import { NotificationItem } from './notification-item';

/**
 * The bell in the top bar: unread count, and the latest notifications on click.
 * The count is ink, not red: an unread notification is information, not danger.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const recent = useRecentNotifications(open);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const router = useRouter();

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const label = unread ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className="relative">
          <Bell aria-hidden />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-sm bg-ink px-1 font-mono text-xs leading-none text-bg">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-90 max-w-[calc(100vw-2rem)] rounded-md border border-line-strong bg-surface shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={!unread || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          </div>
          <NotificationList
            state={recent.isPending ? 'loading' : recent.isError ? 'error' : 'ready'}
            notifications={recent.data?.results ?? []}
            onOpen={openNotification}
            onRetry={() => recent.refetch()}
          />
          <div className="border-t border-line px-3 py-2">
            <Link
              href={routes.notifications}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-ink underline-offset-2 hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

type NotificationListProps = {
  state: 'loading' | 'error' | 'ready';
  notifications: AppNotification[];
  onOpen: (notification: AppNotification) => void;
  onRetry: () => void;
};

function NotificationList({ state, notifications, onOpen, onRetry }: NotificationListProps) {
  if (state === 'loading') {
    return (
      <div className="grid gap-3 p-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="grid justify-items-start gap-2 p-3 text-sm text-ink-2">
        Notifications didn&apos;t load.
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  if (!notifications.length) {
    return (
      <p className="p-3 text-sm text-ink-2">
        You&apos;re all caught up. New assignments, status changes and mentions show up here.
      </p>
    );
  }
  return (
    <ul className="max-h-96 overflow-y-auto py-1">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onOpen={onOpen} />
      ))}
    </ul>
  );
}
