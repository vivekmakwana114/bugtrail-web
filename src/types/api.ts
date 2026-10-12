/*
 * Response shapes from bugtrail-api (see its Swagger at /v1/docs). Only what the UI reads.
 * Feature modules add their own types next to their API calls; shared shapes live here.
 */

export type BugStatus = 'reported' | 'ongoing' | 'resolved' | 'pass' | 'failed';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export type RoleKey = 'admin' | 'project_manager' | 'developer' | 'qa';

/** The smallest user reference: list rows, card managers, chat senders. */
export type UserRef = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

/** Bug counts for one project (or the dashboard), computed by the API on every request. */
export type BugSummary = {
  total: number;
  /** everything not passed yet */
  open: number;
  byStatus: Record<BugStatus, number>;
  /** the project card's ring: reported | ongoing (+failed) | resolved (+pass) */
  pie: { reported: number; ongoing: number; resolved: number };
};

export type ProjectListItem = {
  id: string;
  name: string;
  key: string;
  status: ProjectStatus;
  manager: UserRef | null;
  memberCount: number;
  bugSummary: BugSummary;
  updatedAt: string;
};

/** Milliseconds spent in each status, from the bug's activity log (pass stops the clock). */
export type TimeInStatus = Record<Exclude<BugStatus, 'pass'>, number>;
