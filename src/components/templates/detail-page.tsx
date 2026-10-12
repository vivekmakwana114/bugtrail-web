import type { ReactNode } from 'react';
import { PageHeader } from '@/components/shared/page-header';

type DetailPageProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  /** Full-width band under the header, e.g. the bug's Trail. */
  band?: ReactNode;
  /** The main column: description, facts, timeline. */
  children: ReactNode;
  /** The side panel: chat on a bug, members on a project. Stacks under main below 1024px. */
  aside?: ReactNode;
  asideLabel?: string;
};

/**
 * Template for one-record screens (bug, project, user): header, optional band, main + side panel.
 * The side panel sticks while the main column scrolls on wide screens.
 */
export function DetailPage({
  eyebrow,
  title,
  actions,
  band,
  children,
  aside,
  asideLabel,
}: DetailPageProps) {
  return (
    <div className="grid gap-5">
      <PageHeader eyebrow={eyebrow} title={title} actions={actions} />
      {band && <div className="rounded-md border border-line bg-surface p-4">{band}</div>}
      <div
        className={
          aside ? 'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]' : 'grid gap-5'
        }
      >
        <div className="grid min-w-0 gap-5">{children}</div>
        {aside && (
          <aside
            aria-label={asideLabel}
            className="min-w-0 rounded-md border border-line bg-surface lg:sticky lg:top-4"
          >
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}

/** A titled block inside the main column. Hairline and spacing, not a heavy box. */
export function DetailSection({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-md font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
