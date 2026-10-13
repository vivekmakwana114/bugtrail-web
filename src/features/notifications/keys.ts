/** Query keys for notifications (own file: the socket provider and the hooks both use them). */
export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  recent: () => [...notificationKeys.all, 'recent'] as const,
  list: (unreadOnly: boolean) => [...notificationKeys.all, 'list', { unreadOnly }] as const,
};
