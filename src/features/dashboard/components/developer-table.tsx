'use client';

import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { formatCount, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useDeveloperPerformance } from '../hooks';
import type { DashboardScope } from '../types';
import { DashboardSection } from './dashboard-section';

/**
 * Per current assignee (dashboard:view_performance): how much they hold, how much passed, and how
 * often it came back. Sorted by the API: most passed first.
 */
export function DeveloperTable({ scope }: { scope: DashboardScope }) {
  const developers = useDeveloperPerformance(scope);
  const rows = developers.data ?? [];

  return (
    <DashboardSection
      title="Developer performance"
      note="Counts each bug for whoever is assigned to it now. First-pass = passed QA without ever failing."
      query={developers}
      skeleton={
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-ink-3">
          No assigned bugs in this view yet. Once bugs are assigned, each developer&apos;s numbers
          show up here.
        </p>
      ) : (
        <Table aria-label="Developer performance" className="min-w-160">
          <thead>
            <tr>
              <TableHead>Developer</TableHead>
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead className="text-right">Open</TableHead>
              <TableHead className="text-right">Passed</TableHead>
              <TableHead className="text-right">Fails</TableHead>
              <TableHead className="text-right">First-pass</TableHead>
              <TableHead className="text-right">Avg to pass</TableHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <TableRow key={row.developer?.id ?? `deleted-${i}`}>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={row.developer?.name ?? '?'} src={row.developer?.avatarUrl} />
                    {row.developer?.name ?? <span className="text-ink-3">A deleted user</span>}
                  </span>
                </TableCell>
                <Num value={row.assigned} />
                <Num value={row.open} />
                <Num value={row.passed} />
                <TableCell
                  className={cn(
                    'text-right font-mono',
                    row.totalFails ? 'font-semibold text-danger' : 'text-ink-3',
                  )}
                >
                  {formatCount(row.totalFails)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.firstPassRate === null ? (
                    <NotYet />
                  ) : (
                    `${Math.round(row.firstPassRate * 100)}%`
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.avgTimeToPassMs === null ? <NotYet /> : formatDuration(row.avgTimeToPassMs)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardSection>
  );
}

function Num({ value }: { value: number }) {
  return <TableCell className="text-right font-mono">{formatCount(value)}</TableCell>;
}

/** No passed bugs yet, so there's no rate or average to show (not a zero). */
function NotYet() {
  return (
    <span className="text-ink-3" title="Nothing has passed QA yet">
      –<span className="sr-only">nothing passed yet</span>
    </span>
  );
}
