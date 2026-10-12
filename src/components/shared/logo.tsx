import { cn } from '@/lib/utils';

/**
 * The BugTrail mark is a tiny Trail: four stations on a line and one loop back, the product's
 * own metaphor. Drawn in ink so it never competes with status colours.
 */
export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-ink', className)}>
      <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden className="shrink-0">
        <line
          x1="4"
          y1="14"
          x2="36"
          y2="14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M26 13 C 26 4, 14 4, 14 13" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="4" cy="14" r="2.6" fill="currentColor" />
        <circle
          cx="14"
          cy="14"
          r="2.6"
          fill="var(--bt-bg)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="26"
          cy="14"
          r="2.6"
          fill="var(--bt-bg)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="36" cy="14" r="3.2" fill="currentColor" />
      </svg>
      {withWordmark && <span className="text-lg font-semibold tracking-tight">BugTrail</span>}
    </span>
  );
}
