'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount } from '@/lib/format';
import { groupByDay } from '../group-by-day';
import { useMarkAllRead, useMarkRead, useNotificationList, useUnreadCount } from '../hooks';
import type { AppNotification } from '../types';
import { NotificationItem } from './notification-item';

type Show = 'all' | 'unread';

/**
 * Everything the bell has ever told you, newest first and grouped by day. The bell shows the
 * latest few; this page is for catching up and finding an older one. ?show=unread is the
 * Unread tab, so it can be linked and survives a refresh.
 */
export function NotificationsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const show: Show = params.get('show') === 'unread' ? 'unread' : 'all';
  const setShow = (next: Show) =>
    router.replace(next === 'unread' ? `${pathname}?show=unread` : pathname, { scroll: false });

  const { data: unread = 0 } = useUnreadCount();
  const markAllRead = useMarkAllRead();

  return (
    // A reading width, not the full panel: these are sentences, not grid columns.
    <div className="grid max-w-3xl gap-5">
      <PageHeader
        title="Notifications"
        description="Assignments, status changes, mentions and messages on your bugs."
        actions={
          <Button disabled={!unread || markAllRead.isPending} onClick={() => markAllRead.mutate()}>
            <CheckCheck aria-hidden />
            Mark all read
          </Button>
        }
      />
      <Tabs value={show} onValueChange={(value) => setShow(value as Show)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{' '}
            {unread > 0 && (
              <span className="font-mono text-xs text-ink-3">{formatCount(unread)}</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {/* One list for both tabs: only the query changes, so there's no hidden second list. */}
      <NotificationFeed unreadOnly={show === 'unread'} onShowAll={() => setShow('all')} />
    </div>
  );
}

function NotificationFeed({
  unreadOnly,
  onShowAll,
}: {
  unreadOnly: boolean;
  onShowAll: () => void;
}) {
  const list = useNotificationList(unreadOnly);
  const markRead = useMarkRead();
  const router = useRouter();
  const notifications = list.data?.pages.flatMap((page) => page.results) ?? [];
  const total = list.data?.pages[0]?.totalResults ?? 0;

  const open = (notification: AppNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    if (notification.link) router.push(notification.link);
  };

  if (list.isError) {
    return (
      <ErrorState
        title="Your notifications didn't load"
        description={getErrorMessage(list.error)}
        onRetry={() => list.refetch()}
      />
    );
  }
  if (list.isPending) return <FeedSkeleton />;
  if (notifications.length === 0) {
    return unreadOnly ? (
      <EmptyState
        title="You're all caught up"
        description="Nothing unread. Older notifications are still under All."
        action={
          <Button size="sm" onClick={onShowAll}>
            Show all
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No notifications yet"
        description="When a bug is assigned to you, changes status, or someone mentions you, it shows up here and on the bell."
      />
    );
  }

  return (
    <div className="grid gap-5" aria-busy={list.isPlaceholderData}>
      {groupByDay(notifications).map((group) => (
        <section key={group.key} aria-labelledby={`day-${group.key}`} className="grid gap-2">
          <h2 id={`day-${group.key}`} className="text-xs font-medium text-ink-3">
            {group.label}
          </h2>
          <ul className="grid divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
            {group.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={open}
                action={
                  !notification.readAt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Mark read: ${notification.title}`}
                      disabled={markRead.isPending && markRead.variables === notification.id}
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )
                }
              />
            ))}
          </ul>
        </section>
      ))}
      {list.hasNextPage && (
        <Button
          size="sm"
          className="justify-self-start"
          onClick={() => list.fetchNextPage()}
          disabled={list.isFetchingNextPage}
        >
          {list.isFetchingNextPage
            ? 'Loading…'
            : `Show more (${formatCount(total - notifications.length)} left)`}
        </Button>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="Loading notifications">
      <Skeleton className="h-3 w-16" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
