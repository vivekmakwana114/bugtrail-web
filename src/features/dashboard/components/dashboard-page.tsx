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
  RANGE_SHORT_LABELS,
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
              // Same height as the pill beside it.
              className="h-9.5 w-56"
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
              variant="pill"
              label="Reported in"
              value={range}
              onChange={(next) => update({ range: next })}
              options={(Object.keys(RANGE_SHORT_LABELS) as DashboardRange[]).map((value) => ({
                value,
                label: RANGE_SHORT_LABELS[value],
              }))}
            />
          </>
        }
      />

      <SummaryTiles scope={scope} />

      {/* One full-width block per row: roles without the performance table get no empty gap
          beside the status bars. */}
      <StatusBars scope={scope} />
      {canSeePerformance && <DeveloperTable scope={scope} />}

      <SlowestTickets
        scope={scope}
        view={tickets}
        onViewChange={(next) => update({ tickets: next })}
      />
    </div>
  );
}
