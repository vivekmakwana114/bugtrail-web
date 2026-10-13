import type { AppNotification } from './types';

export type DayGroup = { key: string; label: string; notifications: AppNotification[] };

const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const dateWithYearFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Local midnight of the day `date` falls on. */
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * "Today", "Yesterday", the weekday within the last week ("Monday"), then "Mon 6 Oct", and the
 * year once it's not this year. Days are local (the reader's calendar, not UTC). Client-only.
 */
export function dayLabel(day: Date, now: Date = new Date()): string {
  const daysAgo = Math.round((startOfDay(now).getTime() - day.getTime()) / 86_400_000);
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return weekdayFormat.format(day);
  if (day.getFullYear() === now.getFullYear()) return dateFormat.format(day);
  return dateWithYearFormat.format(day);
}

/**
 * Splits a newest-first list into consecutive day groups, keeping the order. A day that
 * continues onto the next "Show more" page merges into the same group.
 */
export function groupByDay(notifications: AppNotification[], now: Date = new Date()): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const notification of notifications) {
    const day = startOfDay(new Date(notification.createdAt));
    const key = day.toISOString();
    const last = groups.at(-1);
    if (last?.key === key) last.notifications.push(notification);
    else groups.push({ key, label: dayLabel(day, now), notifications: [notification] });
  }
  return groups;
}
