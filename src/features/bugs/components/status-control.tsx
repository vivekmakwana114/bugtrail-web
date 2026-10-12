'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusGlyph } from '@/components/shared/status-glyph';
import { STATUS_META } from '@/config/statuses';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import type { BugStatus } from '@/types/api';
import { useChangeBugStatus } from '../hooks';
import type { BugDetail } from '../types';

/*
 * The API decides WHICH moves this user may make (bug.allowedStatuses, per viewer). This map only
 * decides how they're presented: the lifecycle's next step gets a button, anything else allowed
 * (QA and Admin may set any status) sits under "More".
 */
const NEXT_STEPS: Record<BugStatus, BugStatus[]> = {
  reported: ['ongoing'],
  ongoing: ['resolved'],
  resolved: ['pass', 'failed'],
  failed: ['ongoing'],
  pass: [],
};

/** Verbs for the buttons: what the person is doing, not the status name. */
const ACTION_LABELS: Record<BugStatus, string> = {
  reported: 'Back to Reported',
  ongoing: 'Start work',
  resolved: 'Mark resolved',
  pass: 'Pass',
  failed: 'Fail',
};

type StatusControlProps = {
  bug: BugDetail;
  /** Why there are no moves, shown instead of buttons. */
  readOnlyReason: string;
};

/** The bug's next moves, plus "Email reporter & assignee" for the notification they trigger. */
export function StatusControl({ bug, readOnlyReason }: StatusControlProps) {
  const changeStatus = useChangeBugStatus(bug);
  const [sendEmail, setSendEmail] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BugStatus>();

  if (bug.allowedStatuses.length === 0) {
    return <p className="text-sm text-ink-3">{readOnlyReason}</p>;
  }

  const primary = NEXT_STEPS[bug.status].filter((s) => bug.allowedStatuses.includes(s));
  const more = bug.allowedStatuses.filter((s) => !primary.includes(s));

  const move = async (status: BugStatus) => {
    setPendingStatus(status);
    try {
      const updated = await changeStatus.mutateAsync({ status, sendEmail });
      toast.success(`${updated.key} is now ${STATUS_META[status].label}`, {
        description: status === 'failed' ? `Fail count: ${updated.failCount}` : undefined,
      });
      setSendEmail(false);
    } catch (error) {
      toast.error(
        getErrorStatus(error) === 409 ? 'Someone else moved this bug first' : "Couldn't move it",
        {
          description:
            getErrorStatus(error) === 409
              ? 'The page now shows its current status. Decide again.'
              : getErrorMessage(error),
        },
      );
    } finally {
      setPendingStatus(undefined);
    }
  };

  const busy = changeStatus.isPending;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {primary.map((status, i) => (
        <Button
          key={status}
          variant={status === 'failed' ? 'danger' : i === 0 ? 'primary' : 'secondary'}
          disabled={busy}
          onClick={() => move(status)}
        >
          <StatusGlyph status={status} />
          {pendingStatus === status ? `${ACTION_LABELS[status]}…` : ACTION_LABELS[status]}
        </Button>
      ))}
      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={primary.length ? 'ghost' : 'secondary'} disabled={busy}>
              {primary.length ? 'More' : 'Move to'}
              <ChevronDown aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {more.map((status) => (
              <DropdownMenuItem key={status} onSelect={() => move(status)}>
                <StatusGlyph status={status} />
                {STATUS_META[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <label htmlFor="status-send-email" className="ml-1 inline-flex items-center gap-2 text-sm">
        <Checkbox
          id="status-send-email"
          checked={sendEmail}
          onCheckedChange={(checked) => setSendEmail(checked === true)}
          disabled={busy}
        />
        Email reporter &amp; assignee
      </label>
    </div>
  );
}
