'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { routes } from '@/config/routes';
import { STATUS_META } from '@/config/statuses';
import { formatCount } from '@/lib/format';
import type { BugStatus } from '@/types/api';
import { useBugStatusCounts } from '../hooks';
import type { DashboardScope } from '../types';
import { DashboardSection } from './dashboard-section';

/*
 * Tailwind only generates classes it can see in full, so each status's bar colour is spelled out.
 */
const BAR_CLASS: Record<BugStatus, string> = {
  reported: 'bg-reported',
  ongoing: 'bg-ongoing',
  resolved: 'bg-resolved',
  pass: 'bg-pass',
  failed: 'bg-failed',
};

/**
 * Bugs per status as horizontal bars: five numbers don't need a chart library. Bars are scaled to
 * the largest status, so small differences stay visible. With one project selected, each status
 * opens that project's grid filtered to it.
 */
export function StatusBars({ scope }: { scope: DashboardScope }) {
  const counts = useBugStatusCounts(scope);
  const rows = counts.data ?? [];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <DashboardSection
      title="Bugs by status"
      note={`${formatCount(total)} ${total === 1 ? 'bug' : 'bugs'} reported in this view`}
      query={counts}
      skeleton={
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      }
    >
      <ul className="grid gap-3">
        {rows.map(({ status, count }) => {
          const share = total ? Math.round((count / total) * 100) : 0;
          const label = (
            <span className="inline-flex items-center gap-1.5">
              <StatusGlyph status={status} />
              {STATUS_META[status].label}
            </span>
          );
          return (
            <li
              key={status}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_6.5rem] sm:gap-4 text-md"
            >
              {scope.projectId ? (
                <Link
                  href={`${routes.project(scope.projectId)}?status=${status}`}
                  className="hover:underline"
                >
                  {label}
                </Link>
              ) : (
                label
              )}
              <span className="h-3 overflow-hidden rounded-sm bg-sunken" aria-hidden>
                <span
                  className={`block h-full rounded-sm ${BAR_CLASS[status]}`}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-mono whitespace-nowrap">
                {formatCount(count)}
                <span className="text-sm text-ink-3"> · {share}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardSection>
  );
}
