import type { BugStatus, ProjectListItem } from '@/types/api';

/*
 * Sample data for the /design preview only. Deliberately awkward: long names, zero bugs,
 * a fail count of 7, an unassigned ticket. Real screens use the API.
 */

const summary = (
  [reported, ongoing, failed, resolved, pass]: [number, number, number, number, number],
  agedOpen = 0,
) => ({
  total: reported + ongoing + failed + resolved + pass,
  open: reported + ongoing + failed + resolved,
  agedOpen,
  byStatus: { reported, ongoing, failed, resolved, pass },
  pie: { reported, ongoing: ongoing + failed, resolved: resolved + pass },
});

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const project = (
  id: string,
  name: string,
  key: string,
  memberCount: number,
  bugSummary: ReturnType<typeof summary>,
  updatedMinutesAgo: number,
): ProjectListItem => ({
  id,
  name,
  key,
  status: 'active',
  manager: null,
  memberCount,
  bugSummary,
  updatedAt: minutesAgo(updatedMinutesAgo),
});

export const SAMPLE_PROJECTS: ProjectListItem[] = [
  project('p1', 'Checkout revamp', 'CHK', 7, summary([5, 3, 3, 4, 9], 2), 14),
  project('p2', 'Invennico HR portal', 'HRP', 5, summary([2, 3, 0, 6, 25]), 120),
  project(
    'p3',
    'Warehouse scanner app for Android handhelds',
    'WSA',
    3,
    summary([0, 0, 0, 0, 0]),
    4320,
  ),
];

type SampleRow = {
  key: string;
  title: string;
  module: string;
  status: BugStatus;
  assignee: string | null;
  fails: number;
  age: string;
  updated: string;
};

export const SAMPLE_ROWS: SampleRow[] = [
  {
    key: 'CHK-142',
    title: 'Checkout total ignores the second coupon code when both are applied on mobile web',
    module: 'Payments',
    status: 'pass',
    assignee: 'Riya Shah',
    fails: 2,
    age: '6d 4h',
    updated: '14m',
  },
  {
    key: 'CHK-151',
    title: 'Order confirmation email shows the wrong delivery date for orders placed after 11 pm',
    module: 'Notifications',
    status: 'failed',
    assignee: 'Aarav Mehta',
    fails: 7,
    age: '12d 1h',
    updated: '1h',
  },
  {
    key: 'CHK-158',
    title: 'Address form accepts a 5-digit PIN code',
    module: 'Address book',
    status: 'ongoing',
    assignee: 'Riya Shah',
    fails: 0,
    age: '1d 3h',
    updated: '3h',
  },
  {
    key: 'CHK-160',
    title: 'Saved cards list flickers on slow 3G',
    module: 'Payments',
    status: 'resolved',
    assignee: 'Kabir Nair',
    fails: 1,
    age: '2d 6h',
    updated: '5h',
  },
  {
    key: 'CHK-163',
    title: 'Cart badge count is off by one after removing the last item',
    module: 'Cart',
    status: 'reported',
    assignee: null,
    fails: 0,
    age: '4h 10m',
    updated: '4h',
  },
];

const HOUR = 3_600_000;

export const SAMPLE_TRAIL = {
  status: 'pass' as BugStatus,
  failCount: 2,
  timeInStatus: { reported: 2 * HOUR, ongoing: 43 * HOUR, resolved: 3 * HOUR, failed: 31 * HOUR },
};
