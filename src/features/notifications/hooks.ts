'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import * as notificationsApi from './api';
import { notificationKeys } from './keys';

export { notificationKeys };

export const NOTIFICATIONS_PAGE_SIZE = 30;

/**
 * The notifications page, newest first, a page at a time. A new notification over the socket
 * invalidates notificationKeys.all, so this refetches by itself while the page is open.
 */
export function useNotificationList(unreadOnly: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) =>
      notificationsApi.getNotifications({
        ...(unreadOnly && { unread: true }),
        page: pageParam,
        limit: NOTIFICATIONS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

/**
 * The number on the bell. While the socket is connected, `notification:new` refreshes it the
 * moment something arrives (SocketProvider); polling every minute is only the fallback for when
 * it isn't.
 */
export function useUnreadCount() {
  const { connected } = useSocket();
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: connected ? false : 60_000,
  });
}

/** The latest few, loaded only while the bell's menu is open. */
export function useRecentNotifications(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.recent(),
    queryFn: () => notificationsApi.getNotifications({ limit: 8 }),
    enabled,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate });
}

export function useMarkAllRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate });
}
