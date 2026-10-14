import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { ProjectListItem } from '@/types/api';
import { STATUS_META, TROUBLE_AGE_DAYS } from '@/config/statuses';
import { formatCount, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatusGlyph } from './status-glyph';

type ProjectCardProps = {
  project: ProjectListItem;
  href: string;
  /** The ⋯ actions menu, for roles that can change the project. */
  menu?: ReactNode;
};

/*
 * The card's three slices, in lifecycle order. Ongoing counts failed bugs too (back with a
 * developer) and Resolved counts passed ones, as the API's `pie` does. Colours and glyphs are the
 * same as Bugs by status on the dashboard. Class names are spelled out for Tailwind.
 */
const SLICES = [
  { key: 'reported', bar: 'bg-reported' },
  { key: 'ongoing', bar: 'bg-ongoing' },
  { key: 'resolved', bar: 'bg-resolved' },
] as const;

/**
 * One project on the projects grid. Five-second test: how much is open, how far along it is,
 * and whether anything is in trouble (the only red on the card).
 * Not one big link: the ⋯ menu can't live inside a link, so the name and "Open board" are links.
 */
export function ProjectCard({ project, href, menu }: ProjectCardProps) {
  const { bugSummary } = project;
  const { pie, total, open, agedOpen } = bugSummary;
  const failing = bugSummary.byStatus.failed;
  const trouble = [
    failing > 0 && `${failing} failed QA`,
    agedOpen > 0 && `${agedOpen} open > ${TROUBLE_AGE_DAYS}d`,
  ].filter(Boolean);
  const share = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <article
      aria-label={project.name}
      className="grid content-start gap-4 rounded-md border border-line bg-surface p-5 transition-colors hover:border-line-strong motion-reduce:transition-none"
    >
      <header className="flex items-start gap-3">
        <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md bg-sunken px-2 font-mono text-sm font-semibold text-ink-2">
          {project.key}
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <Link
            href={href}
            className="truncate text-lg font-semibold text-ink hover:underline"
            title={project.name}
          >
            {project.name}
          </Link>
          <span className="truncate text-sm text-ink-3">
            {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'} · updated{' '}
            {formatRelative(project.updatedAt)}
          </span>
        </div>
        {menu}
      </header>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="flex items-baseline gap-2">
          <span className="text-display font-semibold tracking-tight text-ink tabular-nums">
            {formatCount(open)}
          </span>
          <span className="text-sm text-ink-3">open of {formatCount(total)}</span>
        </p>
        <span className="font-mono text-sm text-ink-3">
          {total ? `${Math.round(share(pie.resolved))}% resolved` : 'no bugs yet'}
        </span>
      </div>

      {/* Stacked to scale; the exact numbers are in the boxes below, so the bar is decorative. */}
      <div aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-sm bg-sunken">
        {SLICES.map(({ key, bar }) =>
          pie[key] ? (
            <span key={key} className={bar} style={{ width: `${share(pie[key])}%` }} />
          ) : null,
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {SLICES.map(({ key }) => (
          // The glyph sits with the number, so the label gets the box's full width on phones.
          <div key={key} className="grid gap-1 rounded-md bg-sunken px-3 py-2.5">
            <dt className="truncate text-sm text-ink-2">{STATUS_META[key].label}</dt>
            <dd
              className={cn(
                'flex items-center gap-1.5 font-mono text-lg font-semibold',
                pie[key] ? 'text-ink' : 'text-ink-3',
              )}
            >
              <StatusGlyph status={key} />
              {formatCount(pie[key])}
            </dd>
          </div>
        ))}
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm">
        {trouble.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-danger">
            <StatusGlyph status="failed" />
            {trouble.join(' · ')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-ink-3">
            {total ? (
              <>
                <Check className="size-4" aria-hidden />
                Nothing failing or ageing
              </>
            ) : (
              'No bugs reported yet'
            )}
          </span>
        )}
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline"
          aria-label={`Open the ${project.name} board`}
        >
          Open board
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </footer>
    </article>
  );
}
