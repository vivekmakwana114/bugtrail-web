'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { routes } from '@/config/routes';
import { TROUBLE_AGE_DAYS } from '@/config/statuses';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { formatCount } from '@/lib/format';
import { useCanonicalUrl } from '@/lib/use-canonical-url';
import { TicketGrid } from '@/features/bugs/components/ticket-grid';
import type { ProjectDetail } from '@/types/api';
import { projectKeys, useProject } from '../hooks';
import { ProjectOverviewTab } from './project-overview-tab';

type Tab = 'tickets' | 'overview';

/**
 * A project: the ticket grid by default, and an Overview tab (description, bug counts, members).
 * Addressed by key (/projects/BT). The tab is in the URL (?tab=overview) so it survives a
 * refresh and can be linked.
 */
export function ProjectPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const project = useProject(projectKey);
  const tab: Tab = params.get('tab') === 'overview' ? 'overview' : 'tickets';

  // An old id link or a lowercase key opens fine; then the address bar shows /projects/BT.
  const queryClient = useQueryClient();
  useCanonicalUrl(project.data && routes.project(project.data.key), () => {
    if (project.data) queryClient.setQueryData(projectKeys.detail(project.data.key), project.data);
  });

  const setTab = (next: string) => {
    // Grid filters only mean something on the Tickets tab, so switching starts clean.
    router.replace(next === 'overview' ? `${pathname}?tab=overview` : pathname, { scroll: false });
  };

  if (project.isPending) return <ProjectSkeleton />;
  if (project.isError) {
    // The API answers 404 both for "doesn't exist" and "not your project", on purpose.
    return getErrorStatus(project.error) === 404 ? (
      <EmptyState
        title="This project isn't available"
        description="It doesn't exist, it was deleted, or you're not a member. A Project Manager can add you."
        action={
          <Button asChild size="sm">
            <Link href={routes.projects}>Back to projects</Link>
          </Button>
        }
      />
    ) : (
      <ErrorState
        title="This project didn't load"
        description={getErrorMessage(project.error)}
        onRetry={() => project.refetch()}
      />
    );
  }

  const p = project.data;
  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow={
          <>
            <Link href={routes.projects} className="hover:text-ink">
              Projects
            </Link>{' '}
            / {p.key}
          </>
        }
        title={p.name}
        actions={<HeaderSummary project={p} />}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tickets">
            Tickets{' '}
            <span className="font-mono text-xs text-ink-3">{formatCount(p.bugSummary.total)}</span>
          </TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="pt-4">
          <TicketGrid project={p} />
        </TabsContent>
        <TabsContent value="overview" className="pt-4">
          <ProjectOverviewTab project={p} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Open count and the trouble line, so the header answers "how is this project doing?" */
function HeaderSummary({ project }: { project: ProjectDetail }) {
  const { open, agedOpen, byStatus } = project.bugSummary;
  const trouble = [
    byStatus.failed > 0 && `${byStatus.failed} failed QA`,
    agedOpen > 0 && `${agedOpen} open > ${TROUBLE_AGE_DAYS}d`,
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="text-ink-2">
        <span className="font-mono text-ink">{formatCount(open)}</span> open
      </span>
      {trouble.length > 0 && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-danger">
          <StatusGlyph status="failed" />
          {trouble.join(' · ')}
        </span>
      )}
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading project">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-72" />
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
