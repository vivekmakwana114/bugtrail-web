import type { BugStatus, TimeInStatus } from '@/types/api';
import { formatDuration } from '@/lib/format';

/*
 * The Trail: a ticket's life drawn as a path. Stations are Reported → Ongoing → Resolved → Pass;
 * every return from QA (Failed) is a loop from Resolved back to Ongoing. Signature piece: small in
 * the ticket grid (MiniTrail), large at the top of the bug page (TrailPath).
 */

const STATIONS = ['reported', 'ongoing', 'resolved', 'pass'] as const;

/** Where a status sits on the path. Failed is drawn at Resolved: that's where QA turned it back. */
const stationIndex = (status: BugStatus): number =>
  status === 'failed' ? 2 : STATIONS.indexOf(status as (typeof STATIONS)[number]);

const tone = (status: BugStatus) => `var(--bt-${status})`;

const MAX_DRAWN_LOOPS = 3;

/* ------------------------------------------------------------------ mini */

type MiniTrailProps = { status: BugStatus; failCount: number };

/**
 * Where each mini loop peaks (y), innermost first. Fixed heights rather than a formula so even
 * the third loop stays inside the 24px box. More than three fails still draws three: the exact
 * count is in the grid's Fails column right beside it.
 */
const MINI_LOOP_PEAKS = [11, 7.5, 4];

/** 84×24: the stations filled up to where the ticket is, one small loop per QA fail (max 3). */
export function MiniTrail({ status, failCount }: MiniTrailProps) {
  const position = stationIndex(status);
  const xs = [6, 30, 54, 78];
  const y = 17;
  const color = tone(status);
  const loops = Math.min(failCount, MAX_DRAWN_LOOPS);

  return (
    <svg
      viewBox="0 0 84 24"
      width="84"
      height="24"
      role="img"
      aria-label={`${status}, ${failCount} ${failCount === 1 ? 'fail' : 'fails'}`}
      className="block"
    >
      <line x1="6" y1={y} x2="78" y2={y} stroke="var(--bt-line-strong)" strokeWidth="1.5" />
      <line x1="6" y1={y} x2={xs[position]} y2={y} stroke={color} strokeWidth="2" />
      {MINI_LOOP_PEAKS.slice(0, loops).map((peak) => {
        // A cubic peaks 3/4 of the way to its control points, so solve for the control height.
        const control = y - 1 - (y - 1 - peak) / 0.75;
        return (
          <path
            key={peak}
            d={`M54 ${y - 1} C 54 ${control}, 30 ${control}, 30 ${y - 1}`}
            fill="none"
            stroke="var(--bt-failed)"
            strokeWidth="1.3"
          />
        );
      })}
      {xs.map((x, i) => {
        const reached = i <= position;
        return (
          <circle
            key={x}
            cx={x}
            cy={y}
            r={i === position ? 4 : 3}
            fill={reached ? color : 'var(--bt-surface)'}
            stroke={reached ? color : 'var(--bt-line-strong)'}
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ large */

type TrailPathProps = {
  status: BugStatus;
  failCount: number;
  timeInStatus: TimeInStatus;
};

const LABELS = { reported: 'Reported', ongoing: 'Ongoing', resolved: 'Resolved', pass: 'Pass' };

/**
 * The full path for the bug page. Segment labels are the time spent in the status the segment
 * leaves from; the loops carry the time the ticket spent failed. Scrolls sideways on narrow screens.
 */
export function TrailPath({ status, failCount, timeInStatus }: TrailPathProps) {
  const position = stationIndex(status);
  const y = 130;
  const X = [70, 330, 610, 890];
  const loops = Math.min(failCount, MAX_DRAWN_LOOPS);
  const segments = [timeInStatus.reported, timeInStatus.ongoing, timeInStatus.resolved];

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 960 210"
        className="block h-auto w-full min-w-180"
        role="img"
        aria-label={`Trail: ${LABELS[STATIONS[position]]}${failCount ? `, failed QA ${failCount} times` : ''}`}
      >
        <line
          x1={X[0]}
          y1={y}
          x2={X[3]}
          y2={y}
          stroke="var(--bt-line-strong)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1={X[0]}
          y1={y}
          x2={X[position]}
          y2={y}
          stroke="var(--bt-ink)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {segments.map((ms, i) =>
          i < position || (i === position && status !== 'pass') ? (
            <text
              key={i}
              x={(X[i] + X[i + 1]) / 2}
              y={y + 22}
              textAnchor="middle"
              fontSize="12"
              className="fill-ink-2 font-mono"
            >
              {formatDuration(ms)}
            </text>
          ) : null,
        )}

        {Array.from({ length: loops }, (_, i) => {
          // Every loop leaves Resolved and lands on Ongoing at the same two points, so they share
          // one arrowhead (drawn once, below). Heights grow gently so the loops nest and the
          // outermost label stays inside the drawing.
          const a = X[2] - 8;
          const b = X[1] + 8;
          const control = y - 8 - 70 - i * 26;
          // A cubic's midpoint sits 3/4 of the way to its control points: label just above it.
          const peak = y - 8 + 0.75 * (control - (y - 8));
          const outermost = i === loops - 1;
          return (
            <g key={i}>
              <path
                d={`M${a} ${y - 8} C ${a} ${control}, ${b} ${control}, ${b} ${y - 8}`}
                fill="none"
                stroke="var(--bt-failed)"
                strokeWidth="1.8"
              />
              {i === 0 && (
                <path
                  d={`M${b - 5} ${y - 17} L${b} ${y - 8} L${b + 6} ${y - 16}`}
                  fill="none"
                  stroke="var(--bt-failed)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {outermost && (
                <text
                  x={(a + b) / 2}
                  y={peak - 7}
                  textAnchor="middle"
                  fontSize="11.5"
                  fill="var(--bt-failed)"
                  className="font-mono font-medium"
                >
                  {`Failed ${failCount}× · ${formatDuration(timeInStatus.failed)} waiting to restart`}
                </text>
              )}
            </g>
          );
        })}

        {STATIONS.map((station, i) => {
          const reached = i <= position;
          const isPass = station === 'pass';
          return (
            <g key={station}>
              <circle
                cx={X[i]}
                cy={y}
                r={isPass ? 11 : 8}
                fill={isPass && reached ? 'var(--bt-pass)' : 'var(--bt-surface)'}
                stroke={reached ? `var(--bt-${station})` : 'var(--bt-line-strong)'}
                strokeWidth="3"
              />
              {isPass && reached && (
                <path
                  d={`M${X[i] - 5} ${y} l3.5 3.5 l6.5 -7`}
                  fill="none"
                  stroke="var(--bt-surface)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              <text
                x={X[i]}
                y={y + 48}
                textAnchor="middle"
                fontSize="13"
                className={reached ? 'fill-ink font-sans font-semibold' : 'fill-ink-3 font-sans'}
              >
                {LABELS[station]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
