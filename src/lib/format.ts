/*
 * Formatting for machine values. Shown in the mono face, so keep them short and consistent:
 * durations as "6d 4h", counts with grouping, never "a few seconds ago" style prose.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 532_800_000 → "6d 4h", 15_000_000 → "4h 10m", 720_000 → "12m". Two units at most.
 * @param ms duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < MINUTE) return '<1m';
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  if (days > 0) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

const countFormat = new Intl.NumberFormat('en-US');

/** 1284 → "1,284" */
export function formatCount(n: number): string {
  return countFormat.format(n);
}

/** "Riya Shah" → "RS", "admin" → "AD" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/**
 * "just now", "14m ago", "3h ago", "2d ago", then a date ("12 Oct") after a week.
 * Call it only in client-rendered UI: the server's clock and time zone differ from the user's.
 * @param iso ISO timestamp from the API
 */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
  return dateFormat.format(new Date(iso));
}
