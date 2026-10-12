'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { usePermission } from '@/components/auth/can';
import { EmptyState, ErrorState, NoAccessState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/status-badge';
import { MiniTrail } from '@/components/shared/trail';
import { routes } from '@/config/routes';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { formatCount, formatDuration, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProjectDetail } from '@/types/api';
import { useBugList, useProjectModules } from '../hooks';
import type { BugListItem, BugSortField } from '../types';
import { useGridKeyboard } from '../use-grid-keyboard';
import { useGridUrlState } from '../use-grid-url-state';
import { ReportBugDialog } from './report-bug-dialog';
import { TicketFilters } from './ticket-filters';

type Column = {
  id: string;
  header: string;
  sortField?: BugSortField;
  align?: 'right';
  /** Extra classes for both the header and the cells, e.g. hiding a column on narrower screens. */
  className?: string;
  cell: (bug: BugListItem) => ReactNode;
};

/*
 * Server-side sort, filter and paging, so this is a plain table with a typed column list
 * (no table library needed). Columns with `sortField` get a sort button in the header.
 */
const COLUMNS: Column[] = [
  {
    id: 'key',
    header: 'Key',
    sortField: 'bugNumber',
    cell: (b) => <span className="font-mono text-ink-2">{b.key}</span>,
  },
  {
    id: 'title',
    header: 'Title',
    cell: (b) => (
      <Link
        href={routes.bug(b.project.id, b.key)}
        title={b.title}
        className="block max-w-64 truncate hover:underline"
      >
        {b.title}
      </Link>
    ),
  },
  {
    id: 'module',
    header: 'Module',
    cell: (b) => <span className="text-ink-2">{b.moduleName}</span>,
  },
  { id: 'status', header: 'Status', cell: (b) => <StatusBadge status={b.status} /> },
  {
    id: 'assignee',
    header: 'Assignee',
    cell: (b) =>
      b.assignee ? (
        <span className="inline-flex items-center gap-2">
          <Avatar name={b.assignee.name} src={b.assignee.avatarUrl} />
          <span className="max-w-28 truncate">{b.assignee.name}</span>
        </span>
      ) : (
        <span className="text-ink-3">Unassigned</span>
      ),
  },
  {
    id: 'reporter',
    header: 'Reporter',
    // Reporter matters less in triage than assignee; it's on the bug page. Shown from 1536px.
    className: 'hidden 2xl:table-cell',
    cell: (b) => <span className="text-ink-2">{b.reporter.name}</span>,
  },
  {
    id: 'trail',
    header: 'Trail',
    cell: (b) => <MiniTrail status={b.status} failCount={b.failCount} />,
  },
  {
    id: 'fails',
    header: 'Fails',
    sortField: 'failCount',
    align: 'right',
    cell: (b) => (
      <span className={cn('font-mono', b.failCount ? 'font-semibold text-danger' : 'text-ink-3')}>
        {b.failCount}
      </span>
    ),
  },
  {
    id: 'age',
    header: 'Age',
    sortField: 'age',
    align: 'right',
    cell: (b) => <span className="font-mono">{formatDuration(b.ageMs)}</span>,
  },
  {
    id: 'updated',
    header: 'Updated',
    sortField: 'updatedAt',
    align: 'right',
    cell: (b) => <span className="font-mono text-ink-3">{formatRelative(b.updatedAt)}</span>,
  },
];

/** The project's ticket grid: filters, sortable columns, keyboard cursor, show more. */
export function TicketGrid({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const { filters, update, searchInput, setSearchInput, clearAll, isFiltered } = useGridUrlState();
  const list = useBugList(project.id, filters);
  const modules = useProjectModules(project.id);
  const bugs = list.data?.pages.flatMap((page) => page.results) ?? [];
  const total = list.data?.pages[0]?.totalResults ?? 0;
  // Archived projects are read-only (the API refuses new bugs there).
  const canReport = usePermission('bug:create') && project.status !== 'archived';
  const [reportOpen, setReportOpen] = useState(false);

  const openBug = (index: number) => {
    const bug = bugs[index];
    if (bug) router.push(routes.bug(project.id, bug.key));
  };
  const { cursor, setCursor } = useGridKeyboard({
    rowCount: bugs.length,
    onOpen: openBug,
    searchRef,
    onCreate: canReport ? () => setReportOpen(true) : undefined,
  });

  const toggleSort = (field: BugSortField) => {
    const same = filters.sort.field === field;
    const direction = same
      ? filters.sort.direction === 'asc'
        ? 'desc'
        : 'asc'
      : field === 'bugNumber'
        ? 'asc'
        : 'desc';
    update({ sort: { field, direction } });
  };

  let content: ReactNode;
  if (list.isPending) {
    content = <GridSkeleton />;
  } else if (list.isError) {
    content =
      getErrorStatus(list.error) === 403 ? (
        <NoAccessState />
      ) : (
        <ErrorState
          title="The tickets didn't load"
          description={getErrorMessage(list.error)}
          onRetry={() => list.refetch()}
        />
      );
  } else if (bugs.length === 0) {
    content = isFiltered ? (
      <EmptyState
        title="No bugs match these filters"
        description="Try fewer statuses, another assignee, or a different search."
        action={
          <Button size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No bugs reported in this project yet"
        description="When QA reports a bug here, it shows up with its status, assignee, fail count and age."
        action={
          canReport && (
            <Button size="sm" variant="primary" onClick={() => setReportOpen(true)}>
              Report the first bug
            </Button>
          )
        }
      />
    );
  } else {
    content = (
      <>
        <Table
          className="min-w-260"
          aria-label={`Bugs in ${project.name}`}
          aria-busy={list.isPlaceholderData}
        >
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <SortableHead
                  key={column.id}
                  column={column}
                  sort={filters.sort}
                  onSort={toggleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {bugs.map((bug, i) => (
              <TableRow
                key={bug.id}
                data-row-index={i}
                selected={i === cursor}
                onClick={(event) => {
                  setCursor(i);
                  // The title is a real link; clicks elsewhere on the row open the bug too.
                  if (!(event.target as HTMLElement).closest('a')) openBug(i);
                }}
                className="cursor-pointer"
              >
                {COLUMNS.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      'whitespace-nowrap',
                      column.align === 'right' && 'text-right',
                      column.className,
                    )}
                  >
                    {column.cell(bug)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>j</Kbd>
            <Kbd>k</Kbd> move <Kbd className="ml-2">Enter</Kbd> open <Kbd className="ml-2">/</Kbd>{' '}
            search
            {canReport && (
              <>
                <Kbd className="ml-2">c</Kbd> report
              </>
            )}
          </span>
          {list.hasNextPage && (
            <Button
              size="sm"
              onClick={() => list.fetchNextPage()}
              disabled={list.isFetchingNextPage}
            >
              {list.isFetchingNextPage
                ? 'Loading…'
                : `Show more (${formatCount(total - bugs.length)} left)`}
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <section className="grid gap-4" aria-label="Tickets">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <TicketFilters
          filters={filters}
          searchInput={searchInput}
          onSearchInput={setSearchInput}
          searchRef={searchRef}
          onChange={update}
          onClear={clearAll}
          isFiltered={isFiltered}
          members={project.members}
          modules={modules.data ?? []}
        />
        <div className="flex items-center gap-3">
          {list.isSuccess && bugs.length > 0 && (
            <span className="text-sm text-ink-3" aria-live="polite">
              <span className="font-mono">{formatCount(total)}</span> {total === 1 ? 'bug' : 'bugs'}
            </span>
          )}
          {canReport && (
            <Button variant="primary" onClick={() => setReportOpen(true)}>
              <Plus aria-hidden />
              Report bug
              <Kbd className="border-bg/40 text-bg">c</Kbd>
            </Button>
          )}
        </div>
      </div>
      {content}
      {canReport && (
        <ReportBugDialog
          project={project}
          modules={modules.data ?? []}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </section>
  );
}

type SortableHeadProps = {
  column: Column;
  sort: { field: BugSortField; direction: 'asc' | 'desc' };
  onSort: (field: BugSortField) => void;
};

function SortableHead({ column, sort, onSort }: SortableHeadProps) {
  const { sortField } = column;
  const right = column.align === 'right';
  if (!sortField)
    return (
      <TableHead className={cn(right && 'text-right', column.className)}>{column.header}</TableHead>
    );
  const active = sort.field === sortField;
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={cn(right && 'text-right', column.className)}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortField)}
        className={cn('inline-flex items-center gap-1 hover:text-ink', active && 'text-ink')}
      >
        {column.header}
        <Icon className={cn('size-3', !active && 'opacity-50')} aria-hidden />
      </button>
    </TableHead>
  );
}

/** Rows shaped like real rows, so nothing jumps when the data arrives. */
function GridSkeleton() {
  return (
    <div
      className="grid gap-px overflow-hidden rounded-md border border-line bg-line"
      aria-busy="true"
      aria-label="Loading tickets"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 bg-surface px-3 py-3">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}
