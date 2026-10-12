'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DashboardScope } from './types';

export type DashboardRange = 'all' | '7d' | '30d' | '90d';
export type TicketsView = 'open' | 'all';

export const RANGE_LABELS: Record<DashboardRange, string> = {
  all: 'All time',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};
const RANGE_DAYS: Record<Exclude<DashboardRange, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const isRange = (value: string | null): value is DashboardRange =>
  value !== null && value in RANGE_LABELS;

/**
 * Midnight (the user's time zone) at the start of the range: "7 days" = today and the 6 days
 * before it. Rounded to the day so the query key stays the same all day; using "now minus 7×24h"
 * would make a new key, and a new request, on every render.
 */
function rangeStart(days: number): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start.toISOString();
}

/**
 * The dashboard's filters live in the URL (?project=…&range=30d&tickets=all), so a view can be
 * shared and survives a refresh. Defaults (all projects, all time, open tickets) stay out of it.
 */
export function useDashboardUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const projectId = params.get('project') ?? undefined;
  const rangeParam = params.get('range');
  const range: DashboardRange = isRange(rangeParam) ? rangeParam : 'all';
  const tickets: TicketsView = params.get('tickets') === 'all' ? 'all' : 'open';

  const scope: DashboardScope = {
    projectId,
    from: range === 'all' ? undefined : rangeStart(RANGE_DAYS[range]),
  };

  const update = (next: {
    project?: string | null;
    range?: DashboardRange;
    tickets?: TicketsView;
  }) => {
    const query = new URLSearchParams(params.toString());
    const set = (key: string, value: string | null | undefined, fallback?: string) =>
      value && value !== fallback ? query.set(key, value) : query.delete(key);
    if ('project' in next) set('project', next.project);
    if ('range' in next) set('range', next.range, 'all');
    if ('tickets' in next) set('tickets', next.tickets, 'open');
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  return { scope, range, tickets, projectId, update };
}
