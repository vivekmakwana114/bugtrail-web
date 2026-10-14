import { ChevronRight, RotateCcw } from 'lucide-react';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BugSummary } from '@/types/api';

/*
 * The four stations a bug passes through, with what a count there means. Failed isn't a station:
 * it's the loop back from QA to Ongoing, drawn under the row. Class names are spelled out for
 * Tailwind; the colours are the status tokens used everywhere else.
 */
const STATIONS = [
  {
    status: 'reported',
    label: 'Reported',
    hint: 'Waiting for triage',
    ring: 'border-reported text-reported',
  },
  { status: 'ongoing', label: 'Ongoing', hint: 'Being fixed', ring: 'border-ongoing text-ongoing' },
  {
    status: 'resolved',
    label: 'Resolved',
    hint: 'Ready for QA',
    ring: 'border-resolved text-resolved',
  },
  { status: 'pass', label: 'QA passed', hint: 'Verified fixed', ring: 'border-pass text-pass' },
] as const;

/**
 * A project's bugs as a flow: how many sit at each station right now, and how many QA sent back.
 * The same shape as the bug page's Trail, so a project reads like one big ticket.
 * Empty stations stay grey, so the eye goes to where the bugs are.
 */
export function StatusFlow({ byStatus }: { byStatus: BugSummary['byStatus'] }) {
  const failed = byStatus.failed;
  return (
    <div className="grid gap-1">
      <ol className="grid grid-cols-4" aria-label="Bugs at each stage">
        {STATIONS.map(({ status, label, hint, ring }, i) => {
          const count = byStatus[status];
          return (
            <li key={status} className="relative grid justify-items-center gap-3 text-center">
              {/* Connector to the next ring: from this ring's right edge to the next one's left. */}
              {i < STATIONS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-7 right-[calc(-50%+2.25rem)] left-[calc(50%+2.25rem)] flex items-center sm:top-8 sm:right-[calc(-50%+2.75rem)] sm:left-[calc(50%+2.75rem)]"
                >
                  <span className="h-px flex-1 bg-line-strong" />
                  <ChevronRight className="-ml-1.5 size-4 shrink-0 text-ink-3" />
                </span>
              )}
              <span
                className={cn(
                  'relative grid size-14 place-items-center rounded-full border-2 bg-surface font-mono text-xl font-semibold sm:size-16',
                  count ? ring : 'border-line-strong text-ink-3',
                )}
              >
                {formatCount(count)}
              </span>
              <span className="grid gap-0.5 px-1">
                <span className={cn('text-md font-semibold', count ? 'text-ink' : 'text-ink-2')}>
                  {label}
                </span>
                <span className="text-sm text-ink-3">{hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* The way back: QA (last station) to Ongoing (second), centre to centre. */}
      <div aria-hidden className="relative h-10">
        <span
          className={cn(
            'absolute top-0 right-[12.5%] left-[37.5%] h-5 rounded-b-md border-x border-b border-dashed',
            failed ? 'border-danger/60' : 'border-line-strong',
          )}
        />
        <span
          className={cn(
            'absolute -top-1 left-[37.5%] size-0 -translate-x-1/2 border-x-4 border-b-6 border-x-transparent',
            failed ? 'border-b-danger/60' : 'border-b-line-strong',
          )}
        />
      </div>
      <p className="-mt-9 flex justify-center pl-[25%]">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-0.5 text-sm',
            failed ? 'border-danger/40 font-semibold text-danger' : 'border-line-strong text-ink-3',
          )}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {formatCount(failed)} failed QA
        </span>
      </p>
    </div>
  );
}
