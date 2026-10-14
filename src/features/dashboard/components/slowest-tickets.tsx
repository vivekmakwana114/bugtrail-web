'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { routes } from '@/config/routes';
import { STATUS_META, TROUBLE_AGE_DAYS } from '@/config/statuses';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SLOWEST_LIMIT } from '../api';
import { useSlowestTickets } from '../hooks';
import type { DashboardScope, SlowTicket } from '../types';
import type { TicketsView } from '../use-dashboard-url-state';
import { DashboardSection } from './dashboard-section';

const AGED_MS = TROUBLE_AGE_DAYS * 24 * 60 * 60 * 1000;

type SlowestTicketsProps = {
  scope: DashboardScope;
  view: TicketsView;
  onViewChange: (view: TicketsView) => void;
};

/**
 * The oldest tickets by age (reported until passed, or until now), each drawn as a lifeline
 * scaled to the oldest one, so "how much older" reads at a glance. "Open" leaves out passed
 * ones: those are the tickets someone should look at today.
 */
export function SlowestTickets({ scope, view, onViewChange }: SlowestTicketsProps) {
  const tickets = useSlowestTickets(scope, view === 'open');
  const rows = tickets.data ?? [];
  const showProject = !scope.projectId;
  const maxAge = Math.max(1, ...rows.map((bug) => bug.ageMs));

  return (
    <DashboardSection
      title="Longest lifelines"
      note={`The ${SLOWEST_LIMIT} oldest tickets, by age since reported. Older than ${TROUBLE_AGE_DAYS} days is marked.`}
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
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
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
        <ul aria-label="Longest lifelines" className="grid">
          {rows.map((bug) => (
            <Lifeline key={bug.id} bug={bug} maxAge={maxAge} showProject={showProject} />
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}

/** One ticket: key, title and age on top; under it the line, then who has it, its status and fails. */
function Lifeline({
  bug,
  maxAge,
  showProject,
}: {
  bug: SlowTicket;
  maxAge: number;
  showProject: boolean;
}) {
  const aged = bug.ageMs > AGED_MS;
  // A floor so the youngest ticket still shows a line, not just its two end dots.
  const length = Math.max((bug.ageMs / maxAge) * 100, 4);

  return (
    <li className="grid gap-2.5 border-t border-line py-3.5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="shrink-0 font-mono text-sm text-ink-3">{bug.key}</span>
        <Link
          href={routes.bug(bug.project.key, bug.key)}
          title={bug.title}
          className="min-w-0 truncate font-medium text-ink hover:underline"
        >
          {bug.title}
        </Link>
        {showProject && (
          <span className="hidden shrink-0 text-sm text-ink-3 sm:inline">{bug.project.name}</span>
        )}
        <span
          className={cn(
            'ml-auto shrink-0 font-mono text-lg font-semibold',
            aged ? 'text-danger' : 'text-ink',
          )}
        >
          {formatDuration(bug.ageMs)}
        </span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 sm:flex-nowrap">
        {/* Shrinks before the meta does, so a full-length line never pushes it off the row. */}
        <span aria-hidden className="flex min-w-6 items-center" style={{ width: `${length}%` }}>
          <span className="size-1.5 shrink-0 rounded-full bg-ink-3" />
          <span className={cn('h-0.5 flex-1', aged ? 'bg-danger' : 'bg-ink-2')} />
          <span
            className={cn(
              'size-2.5 shrink-0 rounded-full border-2 bg-surface',
              aged ? 'border-danger' : 'border-ink-2',
            )}
          />
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-ink-2">
          {bug.assignee ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={bug.assignee.name} src={bug.assignee.avatarUrl} />
              <span className="max-w-40 truncate">{bug.assignee.name}</span>
            </span>
          ) : (
            <span className="text-ink-3">Unassigned</span>
          )}
          <Dot />
          <span className="inline-flex items-center gap-1.5">
            <StatusGlyph status={bug.status} />
            {STATUS_META[bug.status].label}
          </span>
          {bug.failCount > 0 && (
            <>
              <Dot />
              <span className="font-mono font-semibold text-danger">
                {bug.failCount} {bug.failCount === 1 ? 'fail' : 'fails'}
              </span>
            </>
          )}
        </span>
      </div>
    </li>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-ink-3">
      ·
    </span>
  );
}
