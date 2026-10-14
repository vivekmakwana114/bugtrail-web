'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { ErrorState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/status-badge';
import { routes } from '@/config/routes';
import { useRecentBugs } from '@/features/bugs/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { formatRelative } from '@/lib/format';

const RECENT_LIMIT = 8;

/** Small-caps column headings, as on the dashboard tiles. */
const HEAD = 'font-mono tracking-widest uppercase';

/**
 * What changed last, across every project you can see (not just the filtered cards): a quick way
 * back into the bugs that are moving. Each row opens its bug.
 */
export function RecentBugs() {
  const recent = useRecentBugs(RECENT_LIMIT);
  const rows = recent.data ?? [];

  return (
    <section
      aria-labelledby="recent-bugs-title"
      className="grid min-w-0 gap-3 rounded-md border border-line bg-surface p-5"
    >
      <h2 id="recent-bugs-title" className="text-lg font-semibold">
        Recently updated bugs
      </h2>

      {recent.isPending ? (
        <div aria-busy="true" aria-label="Loading recent bugs" className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : recent.isError ? (
        <ErrorState
          title="Recent bugs didn't load"
          description={getErrorMessage(recent.error)}
          onRetry={() => recent.refetch()}
          className="py-6"
        />
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink-3">No bugs reported yet. Updates show up here.</p>
      ) : (
        // min-w-0 + overflow: on phones the table scrolls inside the card, not the page.
        <div className="relative -mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-160 border-collapse text-sm">
            <thead>
              <tr>
                <TableHead className={`${HEAD} pl-0`}>Bug</TableHead>
                <TableHead className={HEAD}>Project</TableHead>
                <TableHead className={HEAD}>Status</TableHead>
                <TableHead className={`${HEAD} pr-0 text-right`}>Updated</TableHead>
              </tr>
            </thead>
            <tbody>
              {rows.map((bug) => (
                <TableRow key={bug.id} className="hover:bg-transparent">
                  <TableCell className="py-3 pl-0">
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 font-mono text-ink-3">{bug.key}</span>
                      <Link
                        href={routes.bug(bug.project.key, bug.key)}
                        title={bug.title}
                        className="max-w-xl truncate font-medium text-ink hover:underline"
                      >
                        {bug.title}
                      </Link>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-ink-2">{bug.project.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={bug.status} />
                  </TableCell>
                  <TableCell className="pr-0 text-right font-mono whitespace-nowrap text-ink-3">
                    {formatRelative(bug.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
