import type { BugStatus } from '@/types/api';

/** Lifecycle order: how statuses are listed everywhere (filters, charts, selects). */
export const BUG_STATUSES: readonly BugStatus[] = [
  'reported',
  'ongoing',
  'resolved',
  'pass',
  'failed',
];

export const STATUS_META: Record<BugStatus, { label: string; meaning: string }> = {
  reported: { label: 'Reported', meaning: 'Logged by QA, nobody has picked it up.' },
  ongoing: { label: 'Ongoing', meaning: 'A developer is working on it.' },
  resolved: { label: 'Resolved', meaning: 'Fixed by the developer, waiting for QA.' },
  pass: { label: 'Pass', meaning: 'Verified by QA. The clock stops.' },
  failed: { label: 'Failed', meaning: 'QA sent it back. Adds one to the fail count.' },
};

/*
 * Tailwind only generates classes it can see written out in full, so status colours are listed
 * here as literal class names (never built like `text-${status}`).
 */
export const STATUS_TEXT: Record<BugStatus, string> = {
  reported: 'text-reported',
  ongoing: 'text-ongoing',
  resolved: 'text-resolved',
  pass: 'text-pass',
  failed: 'text-failed',
};

export const STATUS_BADGE: Record<BugStatus, string> = {
  reported: 'bg-reported/10 border-reported/30',
  ongoing: 'bg-ongoing/10 border-ongoing/30',
  resolved: 'bg-resolved/10 border-resolved/30',
  pass: 'bg-pass/10 border-pass/30',
  failed: 'bg-failed/10 border-failed/30',
};

/**
 * Project card trouble signal: a project is "in trouble" when bugs are failing QA right now, or
 * open bugs are older than this. Approved default (2026-10-12); change it here only.
 */
export const TROUBLE_AGE_DAYS = 7;
