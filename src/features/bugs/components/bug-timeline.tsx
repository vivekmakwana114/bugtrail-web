'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { getErrorMessage } from '@/lib/api-client';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useBugActivity } from '../hooks';
import type { BugActivityItem } from '../types';

/** How close to the bottom (px) still counts as "reading the newest", i.e. keep following. */
const PINNED_SLACK = 24;

/**
 * The timeline in a box of its own, set beside Chat with the same header and height. It scrolls
 * inside, opens on the newest entry (the list is oldest first), and follows new entries only
 * while you're at the bottom, so reading older history isn't interrupted by a live update.
 */
export function ActivityPanel({ bugKey, className }: { bugKey: string; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const onScroll = () => {
      pinned.current =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < PINNED_SLACK;
    };
    // Content grows when the list loads and when live entries arrive: stay at the bottom then.
    const observer = new ResizeObserver(() => {
      if (pinned.current) scroller.scrollTop = scroller.scrollHeight;
    });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    observer.observe(content);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    // A plain box; the scrolling area below is the one named region, so it's announced once.
    <div
      className={cn('flex min-w-0 flex-col rounded-md border border-line bg-surface', className)}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h2 id="bug-activity-title" className="text-md font-semibold">
          Activity
        </h2>
      </header>
      {/* Focusable so keyboard users can scroll it too. */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-labelledby="bug-activity-title"
        role="region"
        className="min-h-0 flex-1 overflow-y-auto p-3"
      >
        <div ref={contentRef}>
          <BugTimeline bugKey={bugKey} />
        </div>
      </div>
    </div>
  );
}

/** What the API calls each editable field, in words. */
const FIELD_NAMES: Record<string, string> = {
  title: 'the title',
  moduleName: 'the module',
  description: 'the steps',
  attachments: 'the links',
};

function joinWords(words: string[]): string {
  return words.length < 2
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

/** The sentence after the actor's name. */
function describe(event: BugActivityItem): ReactNode {
  switch (event.type) {
    case 'created':
      return event.to === 'reported' ? (
        'reported it'
      ) : (
        <>
          reported it as <StatusBadge status={event.to} />
        </>
      );
    case 'status_changed':
      return (
        <>
          moved it from <StatusBadge status={event.from} /> to <StatusBadge status={event.to} />
        </>
      );
    case 'assigned':
      if (!event.to) return <>unassigned {event.from?.name ?? 'it'}</>;
      if (!event.from) return <>assigned it to {event.to.name}</>;
      return (
        <>
          reassigned it from {event.from.name} to {event.to.name}
        </>
      );
    case 'updated':
      return `edited ${joinWords(event.fields.map((field) => FIELD_NAMES[field] ?? field))}`;
    case 'deleted':
      return 'deleted it';
  }
}

/** Everything that happened to the bug, oldest first, from its append-only activity log. */
export function BugTimeline({ bugKey }: { bugKey: string }) {
  const activity = useBugActivity(bugKey);

  if (activity.isPending) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Loading activity">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-3/4" />
        ))}
      </div>
    );
  }
  if (activity.isError) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
        The activity didn&apos;t load: {getErrorMessage(activity.error)}
        <Button size="sm" onClick={() => activity.refetch()}>
          Retry
        </Button>
      </p>
    );
  }

  return (
    <ol className="grid gap-3">
      {activity.data.map((event) => (
        <li key={event.id} className="flex items-start gap-2.5 text-sm">
          <Avatar name={event.actor?.name ?? '?'} src={event.actor?.avatarUrl} />
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-2">
            <span className="font-medium text-ink">{event.actor?.name ?? 'A deleted user'}</span>
            {describe(event)}
          </span>
          <time
            dateTime={event.createdAt}
            title={formatDateTime(event.createdAt)}
            className="shrink-0 font-mono text-xs text-ink-3"
          >
            {formatRelative(event.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}
