import type { BugSummary } from '@/types/api';
import { formatCount } from '@/lib/format';

const SLICES = [
  { key: 'reported', stroke: 'var(--bt-reported)' },
  { key: 'ongoing', stroke: 'var(--bt-ongoing)' },
  { key: 'resolved', stroke: 'var(--bt-resolved)' },
] as const;

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type StatusRingProps = {
  pie: BugSummary['pie'];
  open: number;
  size?: number;
};

/**
 * The project card's ring: Reported / Ongoing (+failed) / Resolved (+pass), drawn to scale,
 * with the open count in the middle. Exact counts sit in the legend next to it, because rings
 * are good at "roughly how much" and bad at "exactly how many".
 */
export function StatusRing({ pie, open, size = 96 }: StatusRingProps) {
  const total = pie.reported + pie.ongoing + pie.resolved;
  const gap = total > 1 ? 2 : 0;
  // Each slice starts where the previous ones end: lengths, then running starts, both pure.
  const lengths = SLICES.map(({ key }) => (total ? (pie[key] / total) * CIRCUMFERENCE : 0));
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, n) => sum + n, 0));
  const arcs = SLICES.map(({ key, stroke }, i) => {
    if (!pie[key]) return null;
    const dash = Math.max(lengths[i] - gap, 0.5);
    return (
      <circle
        key={key}
        cx="48"
        cy="48"
        r={RADIUS}
        fill="none"
        stroke={stroke}
        strokeWidth="9"
        strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
        strokeDashoffset={-starts[i]}
        transform="rotate(-90 48 48)"
      />
    );
  });

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={`${open} open of ${total} bugs`}
      className="shrink-0"
    >
      <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="var(--bt-line)" strokeWidth="9" />
      {arcs}
      {/* SVG text sizes are in viewBox units (they scale with the ring), so they're attributes. */}
      <text
        x="48"
        y="51"
        textAnchor="middle"
        fontSize="20"
        className="fill-ink font-mono font-semibold"
      >
        {formatCount(open)}
      </text>
      <text
        x="48"
        y="65"
        textAnchor="middle"
        fontSize="9.5"
        className="fill-ink-3 font-sans tracking-wider"
      >
        OPEN
      </text>
    </svg>
  );
}
