import type { ReactNode } from 'react';
import { ErrorState } from '@/components/shared/states';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type DashboardSectionProps = {
  title: string;
  /** One line under the title: what the numbers count. */
  note?: ReactNode;
  actions?: ReactNode;
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    isPlaceholderData: boolean;
    refetch: () => unknown;
  };
  skeleton: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * One dashboard block with its own loading and error state, so a slow or failing query only
 * affects its own section. While a new filter loads, the old numbers stay, dimmed.
 */
export function DashboardSection({
  title,
  note,
  actions,
  query,
  skeleton,
  className,
  children,
}: DashboardSectionProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        // min-w-0 (here and below): let a wide table scroll inside its frame instead of widening the page.
        'grid min-w-0 content-start gap-3 rounded-md border border-line bg-surface p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <h2 className="text-md font-semibold">{title}</h2>
          {note && <p className="text-xs text-ink-3">{note}</p>}
        </div>
        {actions}
      </div>
      {query.isPending ? (
        <div aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`}>
          {skeleton}
        </div>
      ) : query.isError ? (
        <ErrorState
          title={`${title} didn't load`}
          description={getErrorMessage(query.error)}
          onRetry={() => query.refetch()}
          className="py-6"
        />
      ) : (
        <div
          aria-busy={query.isPlaceholderData}
          className={cn('min-w-0 transition-opacity', query.isPlaceholderData && 'opacity-60')}
        >
          {children}
        </div>
      )}
    </section>
  );
}
