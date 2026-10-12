import type { BugStatus, BugSummary, ProjectStatus, UserRef } from '@/types/api';
import type { BugListItem } from '@/features/bugs/types';

/** The dashboard's scope: one project or all of yours, and when the bugs were reported. */
export type DashboardScope = {
  projectId?: string;
  /** ISO date-times; undefined = no limit on that side */
  from?: string;
  to?: string;
};

/** GET /dashboard/summary. Project counts ignore the date range; bug counts respect it. */
export type DashboardSummary = {
  projects: Record<ProjectStatus, number>;
  bugs: BugSummary;
};

/** GET /dashboard/bug-status: all five statuses in lifecycle order, zeros included. */
export type StatusCount = { status: BugStatus; count: number };

/** GET /dashboard/developer-performance: one row per current assignee. */
export type DeveloperStats = {
  /** null if the account was deleted since */
  developer: UserRef | null;
  assigned: number;
  open: number;
  passed: number;
  totalFails: number;
  /** passed without ever failing ÷ passed; null when nothing has passed yet */
  firstPassRate: number | null;
  /** reported → pass, averaged over passed bugs; null when nothing has passed yet */
  avgTimeToPassMs: number | null;
};

/** GET /dashboard/slowest-tickets: same shape as a ticket grid row. */
export type SlowTicket = BugListItem;
