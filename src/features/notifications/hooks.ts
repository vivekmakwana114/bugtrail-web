'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  recent: () => [...notificationKeys.all, 'recent'] as const,
};

/**
 * The number on the bell. Polls every minute for now; once the Socket.IO client is wired in,
 * `notification:new` will update it instantly and polling becomes the fallback.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 60_000,
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
