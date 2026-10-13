'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { routes } from '@/config/routes';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SLOWEST_LIMIT } from '../api';
import { useSlowestTickets } from '../hooks';
import type { DashboardScope } from '../types';
import type { TicketsView } from '../use-dashboard-url-state';
import { DashboardSection } from './dashboard-section';

type SlowestTicketsProps = {
  scope: DashboardScope;
  view: TicketsView;
  onViewChange: (view: TicketsView) => void;
};

/**
 * The oldest tickets by age (reported until passed, or until now). "Open" leaves out passed ones:
 * those are the tickets someone should look at today.
 */
export function SlowestTickets({ scope, view, onViewChange }: SlowestTicketsProps) {
  const tickets = useSlowestTickets(scope, view === 'open');
  const rows = tickets.data ?? [];
  const showProject = !scope.projectId;

  return (
    <DashboardSection
      title="Longest-running tickets"
      note={`The ${SLOWEST_LIMIT} oldest by age, with how often each failed QA.`}
      actions={
        <Segmented
          label="Which tickets"
          value={view}
          onChange={onViewChange}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'all', label: 'All' },
          ]}
        />
      }
      query={tickets}
      skeleton={
        <div className="grid gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-ink-3">
          {view === 'open'
            ? 'No open tickets in this view. Everything reported here has passed QA.'
            : 'No tickets reported in this view yet.'}
        </p>
      ) : (
        <Table aria-label="Longest-running tickets" className="min-w-180">
          <thead>
            <tr>
              <TableHead>Key</TableHead>
              <TableHead>Title</TableHead>
              {showProject && <TableHead>Project</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="text-right">Fails</TableHead>
              <TableHead className="text-right">Age</TableHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((bug) => (
              <TableRow key={bug.id}>
                <TableCell className="font-mono whitespace-nowrap text-ink-2">{bug.key}</TableCell>
                <TableCell>
                  <Link
                    href={routes.bug(bug.project.key, bug.key)}
                    title={bug.title}
                    className="block max-w-72 truncate hover:underline"
                  >
                    {bug.title}
                  </Link>
                </TableCell>
                {showProject && (
                  <TableCell className="whitespace-nowrap text-ink-2">{bug.project.name}</TableCell>
                )}
                <TableCell>
                  <StatusBadge status={bug.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {bug.assignee ? (
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={bug.assignee.name} src={bug.assignee.avatarUrl} />
                      <span className="max-w-28 truncate">{bug.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-ink-3">Unassigned</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-mono',
                    bug.failCount ? 'font-semibold text-danger' : 'text-ink-3',
                  )}
                >
                  {bug.failCount}
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap">
                  {formatDuration(bug.ageMs)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </DashboardSection>
  );
}
