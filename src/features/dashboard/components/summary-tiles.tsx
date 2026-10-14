'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { TROUBLE_AGE_DAYS } from '@/config/statuses';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useDashboardSummary } from '../hooks';
import type { DashboardScope } from '../types';

/**
 * The top line: how much is open, how much of it is in trouble, how much got done. Per-status
 * counts are in the chart below, so they aren't repeated here.
 */
export function SummaryTiles({ scope }: { scope: DashboardScope }) {
  const summary = useDashboardSummary(scope);

  if (summary.isPending) {
    return (
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-5"
        aria-busy="true"
        aria-label="Loading summary"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }
  if (summary.isError) {
    return (
      <ErrorState
        title="The summary didn't load"
        description={getErrorMessage(summary.error)}
        onRetry={() => summary.refetch()}
      />
    );
  }

  const { bugs, projects } = summary.data;
  return (
    // Label/value pairs: a description list, so screen readers hear "Open bugs: 5".
    <dl
      aria-label="Summary"
      className={cn(
        'grid grid-cols-2 gap-3 transition-opacity md:grid-cols-5',
        summary.isPlaceholderData && 'opacity-60',
      )}
      aria-busy={summary.isPlaceholderData}
    >
      <Tile label="Open bugs" value={bugs.open} note={`of ${formatCount(bugs.total)} reported`} />
      <Tile
        label="Failed QA"
        value={bugs.byStatus.failed}
        tone={bugs.byStatus.failed > 0 ? 'danger' : undefined}
        note="sent back for a fix"
      />
      <Tile
        label={`Open > ${TROUBLE_AGE_DAYS} days`}
        value={bugs.agedOpen}
        tone={bugs.agedOpen > 0 ? 'danger' : undefined}
        note="older than a week"
      />
      <Tile label="Passed" value={bugs.byStatus.pass} note="verified by QA" />
      <Tile
        label="Active projects"
        value={projects.active}
        note={`${formatCount(projects.completed)} completed · ${formatCount(projects.archived)} archived`}
      />
    </dl>
  );
}

function Tile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: ReactNode;
  tone?: 'danger';
}) {
  // The number stays ink so the row reads evenly; the note carries the warning colour.
  // Notes are sans, not mono: mono is too wide for five boxes in a row and wrapped.
  return (
    <div className="grid content-start gap-3 rounded-md border border-line bg-surface p-5 last:col-span-2 md:last:col-span-1">
      <dt className="font-mono text-xs tracking-widest text-ink-3 uppercase">{label}</dt>
      <dd className="text-display font-semibold tracking-tight text-ink tabular-nums">
        {formatCount(value)}
      </dd>
      <dd className={cn('text-sm', tone === 'danger' ? 'text-danger' : 'text-ink-3')}>{note}</dd>
    </div>
  );
}
