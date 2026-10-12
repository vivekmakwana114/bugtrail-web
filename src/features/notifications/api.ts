import { api } from '@/lib/api-client';
import type { Page } from '@/types/api';
import type { AppNotification } from './types';

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function getNotifications(params: {
  unread?: boolean;
  limit?: number;
  page?: number;
}): Promise<Page<AppNotification>> {
  const { data } = await api.get<Page<AppNotification>>('/notifications', { params });
  return data;
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
