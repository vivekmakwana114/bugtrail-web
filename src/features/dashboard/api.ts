import { api } from '@/lib/api-client';
import type {
  DashboardScope,
  DashboardSummary,
  DeveloperStats,
  SlowTicket,
  StatusCount,
} from './types';

export async function getSummary(scope: DashboardScope): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary', { params: scope });
  return data;
}

export async function getBugStatus(scope: DashboardScope): Promise<StatusCount[]> {
  const { data } = await api.get<{ statuses: StatusCount[] }>('/dashboard/bug-status', {
    params: scope,
  });
  return data.statuses;
}

export async function getDeveloperPerformance(scope: DashboardScope): Promise<DeveloperStats[]> {
  const { data } = await api.get<{ developers: DeveloperStats[] }>(
    '/dashboard/developer-performance',
    { params: scope },
  );
  return data.developers;
}

export const SLOWEST_LIMIT = 10;

export async function getSlowestTickets(
  scope: DashboardScope,
  openOnly: boolean,
): Promise<SlowTicket[]> {
  const { data } = await api.get<{ tickets: SlowTicket[] }>('/dashboard/slowest-tickets', {
    params: { ...scope, open: openOnly || undefined, limit: SLOWEST_LIMIT },
  });
  return data.tickets;
}
