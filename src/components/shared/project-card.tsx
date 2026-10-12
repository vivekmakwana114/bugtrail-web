import Link from 'next/link';
import type { ProjectListItem } from '@/types/api';
import { TROUBLE_AGE_DAYS } from '@/config/statuses';
import { formatCount, formatRelative } from '@/lib/format';
import { StatusGlyph } from './status-glyph';
import { StatusRing } from './status-ring';

type ProjectCardProps = {
  project: ProjectListItem;
  href: string;
};

const LEGEND = [
  { key: 'reported', label: 'Reported', swatch: 'bg-reported' },
  { key: 'ongoing', label: 'Ongoing', swatch: 'bg-ongoing' },
  { key: 'resolved', label: 'Resolved', swatch: 'bg-resolved' },
] as const;

/**
 * One project on the projects grid. Five-second test: you can tell which project is in trouble.
 * The trouble line is the only accent colour on the card.
 */
export function ProjectCard({ project, href }: ProjectCardProps) {
  const { bugSummary } = project;
  const failing = bugSummary.byStatus.failed;
  const { agedOpen } = bugSummary;
  const trouble = [
    failing > 0 && `${failing} failed QA`,
    agedOpen > 0 && `${agedOpen} open > ${TROUBLE_AGE_DAYS}d`,
  ].filter(Boolean);

  return (
    <Link
      href={href}
      className="grid gap-3.5 rounded-md border border-line bg-surface p-4 transition-colors hover:border-line-strong motion-reduce:transition-none"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">
          {project.name}
        </span>
        <span className="font-mono text-xs text-ink-3">{project.key}</span>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-sm bg-sunken p-3">
        <StatusRing pie={bugSummary.pie} open={bugSummary.open} />
        <dl className="grid gap-1 text-sm">
          {LEGEND.map(({ key, label, swatch }) => (
            <div key={key} className="grid grid-cols-[0.625rem_1fr_auto] items-center gap-2">
              <span className={`size-2.5 rounded-sm ${swatch}`} aria-hidden />
              <dt className="text-ink-2">{label}</dt>
              <dd className="font-mono text-ink">{formatCount(bugSummary.pie[key])}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap justify-between gap-2 text-xs">
        {trouble.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-danger">
            <StatusGlyph status="failed" />
            {trouble.join(' · ')}
          </span>
        ) : (
          <span className="text-ink-3">
            {bugSummary.total ? 'Nothing failing or ageing' : 'No bugs reported yet'}
          </span>
        )}
        <span className="text-ink-3">
          {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'} ·{' '}
          {formatRelative(project.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
