import type { BugStatus, TimeInStatus, UserRef, UserSummary } from '@/types/api';

/** One row of the ticket grid (GET /bugs). */
export type BugListItem = {
  id: string;
  /** e.g. CHK-142 */
  key: string;
  project: { id: string; key: string; name: string };
  title: string;
  moduleName: string;
  status: BugStatus;
  assignee: UserRef | null;
  reporter: UserRef;
  failCount: number;
  /** reported until passed (or until the API answered), in ms */
  ageMs: number;
  createdAt: string;
  updatedAt: string;
};

export type BugSortField = 'bugNumber' | 'failCount' | 'age' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

/** What the grid can filter and sort by; all of it lives in the URL. */
export type BugListFilters = {
  statuses: BugStatus[];
  /** 'me', 'none' or a user id; undefined = anyone */
  assignee?: string;
  moduleName?: string;
  search?: string;
  sort: { field: BugSortField; direction: SortDirection };
};

/** A Google Drive / Docs link (the only kind of attachment). */
export type BugAttachment = { title: string; url: string };

/** The bug page (GET /bugs/:id), also returned by create and every update. */
export type BugDetail = {
  id: string;
  key: string;
  project: { id: string; key: string; name: string };
  title: string;
  moduleName: string;
  description: string;
  attachments: BugAttachment[];
  status: BugStatus;
  /** Where this user may move the bug next (the API's transition table, per viewer). */
  allowedStatuses: BugStatus[];
  assignee: UserSummary | null;
  reporter: UserSummary | null;
  failCount: number;
  ageMs: number;
  timeInStatus: TimeInStatus;
  lastStatusChangedAt: string;
  resolvedAt: string | null;
  passedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** One timeline entry (GET /bugs/:id/activity), oldest first. */
export type BugActivityItem =
  | BugActivityBase<'created', null, BugStatus>
  | BugActivityBase<'status_changed', BugStatus, BugStatus>
  | BugActivityBase<'assigned', UserRef | null, UserRef | null>
  | (BugActivityBase<'updated', null, null> & { fields: string[] })
  | BugActivityBase<'deleted', null, null>;

type BugActivityBase<T extends string, From, To> = {
  id: string;
  type: T;
  /** null if the user was deleted since */
  actor: UserRef | null;
  from: From;
  to: To;
  createdAt: string;
};
