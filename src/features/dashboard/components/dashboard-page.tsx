'use client';

import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import { usePermission } from '@/components/auth/can';
import { PageHeader } from '@/components/shared/page-header';
import { getProjects } from '@/features/projects/api';
import { projectKeys } from '@/features/projects/hooks';
import {
  RANGE_LABELS,
  useDashboardUrlState,
  type DashboardRange,
} from '../use-dashboard-url-state';
import { DeveloperTable } from './developer-table';
import { SlowestTickets } from './slowest-tickets';
import { StatusBars } from './status-bars';
import { SummaryTiles } from './summary-tiles';

const ALL_PROJECTS = 'all';

/**
 * How the work is going across your projects (or one of them): the top line, bugs by status, the
 * oldest tickets and, for QA/PM/Admin, per-developer numbers. Everything is scoped by the API to
 * projects you're a member of; the filters only narrow that further.
 */
export function DashboardPage() {
  const { scope, range, tickets, projectId, update } = useDashboardUrlState();
  const canSeePerformance = usePermission('dashboard:view_performance');
  // The picker lists every project you can see (any status), by name.
  const projects = useQuery({
    queryKey: [...projectKeys.lists(), 'picker'],
    queryFn: () => getProjects({ limit: 100 }),
    staleTime: 5 * 60_000,
  });
  const projectName = projects.data?.results.find((p) => p.key === projectId)?.name;

  const scopeLine = [
    projectId ? (projectName ?? 'One project') : 'All your projects',
    range === 'all' ? 'all time' : `bugs reported in the last ${RANGE_LABELS[range]}`,
  ].join(' · ');

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Dashboard"
        description={scopeLine}
        actions={
          <>
            <Select
              aria-label="Project"
              className="w-56"
              value={projectId ?? ALL_PROJECTS}
              onValueChange={(value) => update({ project: value === ALL_PROJECTS ? null : value })}
              options={[
                { value: ALL_PROJECTS, label: 'All my projects' },
                ...(projects.data?.results ?? []).map((p) => ({
                  value: p.key,
                  label: `${p.name} (${p.key})`,
                })),
              ]}
            />
            <Segmented<DashboardRange>
              label="Reported in"
              value={range}
              onChange={(next) => update({ range: next })}
              options={(Object.keys(RANGE_LABELS) as DashboardRange[]).map((value) => ({
                value,
                label: RANGE_LABELS[value],
              }))}
            />
          </>
        }
      />

      <SummaryTiles scope={scope} />

      {/* The two compact blocks share a row; the ticket list gets the full width so Age and
          Fails (the columns it exists for) are never cut off. */}
      <div
        className={
          canSeePerformance
            ? 'grid items-start gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]'
            : 'grid items-start gap-5 lg:grid-cols-[minmax(0,32rem)]'
        }
      >
        <StatusBars scope={scope} />
        {canSeePerformance && <DeveloperTable scope={scope} />}
      </div>

      <SlowestTickets
        scope={scope}
        view={tickets}
        onViewChange={(next) => update({ tickets: next })}
      />
    </div>
  );
}
