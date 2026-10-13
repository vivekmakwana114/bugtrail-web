'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented, type SegmentedOption } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/components/auth/can';
import { ProjectCard } from '@/components/shared/project-card';
import { ListPage, type ListState } from '@/components/templates/list-page';
import { routes } from '@/config/routes';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { formatCount } from '@/lib/format';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { ProjectStatus } from '@/types/api';
import { useProjectList } from '../hooks';
import { CreateProjectDialog } from './create-project-dialog';

type StatusFilter = ProjectStatus | 'all';

const STATUS_OPTIONS: SegmentedOption<StatusFilter>[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

const isStatusFilter = (value: string | null): value is StatusFilter =>
  STATUS_OPTIONS.some((option) => option.value === value);

/**
 * The projects grid. Filters live in the URL (?status=completed&q=chk), so a refresh, the Back
 * button or a shared link shows the same view.
 */
export function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canCreate = usePermission('project:create');
  const [creating, setCreating] = useState(false);

  const statusParam = params.get('status');
  const status: StatusFilter = isStatusFilter(statusParam) ? statusParam : 'active';
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '');
  const search = useDebouncedValue(searchInput.trim(), 300);

  const setUrl = (next: { status?: StatusFilter; q?: string }) => {
    const query = new URLSearchParams(params.toString());
    const nextStatus = next.status ?? status;
    if (nextStatus === 'active') query.delete('status');
    else query.set('status', nextStatus);
    const q = next.q ?? searchInput.trim();
    if (q) query.set('q', q);
    else query.delete('q');
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const list = useProjectList({
    status: status === 'all' ? undefined : status,
    search: search || undefined,
  });
  const projects = list.data?.pages.flatMap((page) => page.results) ?? [];
  const total = list.data?.pages[0]?.totalResults ?? 0;
  // The default view (Active, no search) isn't "filtered" from the user's point of view.
  const isDefaultView = status === 'active' && !search;

  const state: ListState = list.isPending
    ? { kind: 'loading' }
    : list.isError
      ? getErrorStatus(list.error) === 403
        ? { kind: 'forbidden' }
        : { kind: 'error', message: getErrorMessage(list.error), onRetry: () => list.refetch() }
      : projects.length === 0
        ? { kind: 'empty' }
        : { kind: 'ready' };

  const clearFilters = () => {
    setSearchInput('');
    setUrl({ status: 'all', q: '' });
  };

  const showAll = (
    <Button size="sm" onClick={clearFilters}>
      Show all projects
    </Button>
  );
  // Empty default view: we only know there are no ACTIVE projects (finished ones may exist),
  // so the copy says exactly that and offers the way to see the rest.
  const empty = !isDefaultView
    ? {
        title: search ? `No projects match "${search}"` : `No ${status} projects`,
        description: 'Try another status or a different search.',
        action: showAll,
      }
    : canCreate
      ? {
          title: 'No active projects',
          description: 'Create a project, add its team, and QA can start reporting bugs to it.',
          action: (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                Create a project
              </Button>
              {showAll}
            </div>
          ),
        }
      : {
          title: "You're not on any active project",
          description:
            'A Project Manager or an Admin adds people to projects; ask them to add you. Finished projects are under Completed.',
          action: showAll,
        };

  return (
    <>
      <ListPage
        title="Projects"
        actions={
          canCreate && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              New project
            </Button>
          )
        }
        toolbar={
          <>
            <Segmented
              label="Project status"
              value={status}
              onChange={(value) => setUrl({ status: value })}
              options={STATUS_OPTIONS}
            />
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-2 left-2.5 size-4 text-ink-3"
                aria-hidden
              />
              <Input
                type="search"
                aria-label="Search projects by name or key"
                placeholder="Search name or key"
                className="pl-8"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onBlur={() => setUrl({})}
                onKeyDown={(event) => event.key === 'Enter' && setUrl({})}
              />
            </div>
            {state.kind === 'ready' && (
              <span className="text-sm text-ink-3 sm:ml-auto" aria-live="polite">
                <span className="font-mono">{formatCount(total)}</span>{' '}
                {total === 1 ? 'project' : 'projects'}
              </span>
            )}
          </>
        }
        state={state}
        loading={<ProjectGridSkeleton />}
        empty={empty}
      >
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy={list.isPlaceholderData}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} href={routes.project(project.key)} />
          ))}
        </div>
        {list.hasNextPage && (
          <Button
            className="justify-self-center"
            onClick={() => list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
          >
            {list.isFetchingNextPage ? 'Loading…' : 'Show more projects'}
          </Button>
        )}
      </ListPage>
      {canCreate && <CreateProjectDialog open={creating} onOpenChange={setCreating} />}
    </>
  );
}

/** Six card-shaped placeholders, the same size as real cards so nothing jumps when they arrive. */
function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid gap-3.5 rounded-md border border-line bg-surface p-4">
          <Skeleton className="h-5 w-2/3" />
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-sm bg-sunken p-3">
            <Skeleton className="size-24 rounded-full bg-line" />
            <div className="grid gap-2">
              <Skeleton className="h-3.5 bg-line" />
              <Skeleton className="h-3.5 bg-line" />
              <Skeleton className="h-3.5 bg-line" />
            </div>
          </div>
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
