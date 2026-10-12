import type { ReactNode } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState, NoAccessState } from '@/components/shared/states';

/** Exactly one of these at a time. Screens map their query state onto it. */
export type ListState =
  | { kind: 'loading' }
  | { kind: 'error'; message?: string; onRetry: () => void }
  | { kind: 'forbidden' }
  | { kind: 'empty' }
  | { kind: 'ready' };

type ListPageProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Filters and search, above the content. Stays visible in every state except forbidden. */
  toolbar?: ReactNode;
  state: ListState;
  /** Skeleton shaped like the content (rows, cards). */
  loading: ReactNode;
  /** What appears here and how to add the first one. */
  empty: { title: string; description?: ReactNode; action?: ReactNode };
  /** The list itself: a table, a card grid. */
  children: ReactNode;
};

/**
 * Template for every list screen (projects, tickets, users, notifications): header, toolbar,
 * then exactly one of loading / error / no access / empty / content. Building screens from this
 * means no screen can forget a state.
 */
export function ListPage({
  title,
  description,
  actions,
  toolbar,
  state,
  loading,
  empty,
  children,
}: ListPageProps) {
  return (
    <div className="grid gap-5">
      <PageHeader
        title={title}
        description={description}
        actions={state.kind === 'forbidden' ? null : actions}
      />
      {toolbar && state.kind !== 'forbidden' && (
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      )}
      {state.kind === 'loading' && <div aria-busy="true">{loading}</div>}
      {state.kind === 'error' && (
        <ErrorState
          title="This list didn't load"
          description={state.message ?? 'Check your connection and try again.'}
          onRetry={state.onRetry}
        />
      )}
      {state.kind === 'forbidden' && <NoAccessState />}
      {state.kind === 'empty' && <EmptyState {...empty} />}
      {state.kind === 'ready' && children}
    </div>
  );
}
