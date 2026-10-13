'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/input';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn, escapeRegExp } from '@/lib/utils';
import { MESSAGE_EDIT_WINDOW_MS } from '../config';
import type { ChatMessage as Message } from '../types';

type ChatMessageProps = {
  message: Message;
  /** Sent by the person viewing: drawn on the right, without avatar or name. */
  mine: boolean;
  /** Same sender within a few minutes of the previous message: skip the avatar, name and time. */
  continued: boolean;
  /** Your own message while the chat is writable: delete any time, edit for 15 seconds after sending. */
  canChange: boolean;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
};

/**
 * One message. Yours sit on the right in an ink bubble; everyone else's on the left in a soft
 * bubble with their avatar and name, so who said what reads at a glance (2026-10-13).
 */
export function ChatMessage({
  message,
  mine,
  continued,
  canChange,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const name = message.sender?.name ?? 'A deleted user';

  // Your message stays editable for 15 seconds after sending (the API enforces it). A timer ends
  // the window on screen at the right moment; an edit still open then is closed with a note.
  const sentAt = new Date(message.createdAt).getTime();
  const [withinEditWindow, setWithinEditWindow] = useState(
    () => Date.now() - sentAt < MESSAGE_EDIT_WINDOW_MS,
  );
  useEffect(() => {
    const left = sentAt + MESSAGE_EDIT_WINDOW_MS - Date.now();
    if (left <= 0) return;
    const timer = setTimeout(() => {
      setWithinEditWindow(false);
      setMode((current) => {
        if (current !== 'edit') return current;
        toast.info('Editing time is over', {
          description: `Messages can be edited for ${MESSAGE_EDIT_WINDOW_MS / 1000} seconds after sending.`,
        });
        return 'view';
      });
    }, left);
    return () => clearTimeout(timer);
  }, [sentAt]);
  const canEdit = canChange && withinEditWindow;

  const run = async (action: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (ok) setMode('view');
  };
  const saveEdit = () => {
    const body = draft.trim();
    if (!body || body === message.body) return setMode('view');
    run(() => onEdit(body));
  };
  const onEditKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setMode('view');
    }
  };

  return (
    <li
      className={cn(
        'group relative flex gap-2 px-3',
        mine && 'flex-row-reverse',
        continued ? 'pt-1' : 'pt-3',
      )}
    >
      {!mine && (
        <div className="w-5.5 shrink-0 pt-0.5">
          {!continued && <Avatar name={name} src={message.sender?.avatarUrl} />}
        </div>
      )}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-0.5',
          mine ? 'items-end' : 'items-start',
          mode === 'edit' ? 'w-full' : 'max-w-[85%]',
        )}
      >
        {!continued && (
          <div className={cn('flex items-baseline gap-2 px-1', mine && 'flex-row-reverse')}>
            {/* Your own name is noise in your own chat; screen readers still get it. */}
            {mine ? (
              <span className="sr-only">You</span>
            ) : (
              <span className="text-sm font-medium text-ink">{name}</span>
            )}
            <time
              dateTime={message.createdAt}
              title={formatDateTime(message.createdAt)}
              className="font-mono text-xs text-ink-3"
            >
              {formatRelative(message.createdAt)}
            </time>
          </div>
        )}

        {message.deleted ? (
          <p className="px-1 text-sm text-ink-3 italic">Message deleted</p>
        ) : mode === 'edit' ? (
          <div className="grid w-full gap-1.5 py-1">
            <Textarea
              autoFocus
              rows={2}
              value={draft}
              maxLength={5000}
              aria-label="Edit message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onEditKeyDown}
              disabled={busy}
              className="resize-none"
            />
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <Button size="sm" variant="primary" onClick={saveEdit} disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode('view')} disabled={busy}>
                Cancel
              </Button>
              Enter to save · Esc to cancel
            </div>
          </div>
        ) : (
          <p
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm leading-5 break-words whitespace-pre-wrap',
              mine ? 'bg-ink text-bg' : 'bg-sunken text-ink',
            )}
          >
            {highlightMentions(message.body ?? '', message.mentions, mine)}
            {message.editedAt && (
              <span
                className={cn('ml-1 text-xs', mine ? 'text-bg/70' : 'text-ink-3')}
                title={formatDateTime(message.editedAt)}
              >
                (edited)
              </span>
            )}
          </p>
        )}

        {mode === 'confirm-delete' && (
          <div role="alert" className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-2">Delete this message for everyone?</span>
            <Button size="sm" variant="danger" onClick={() => run(onDelete)} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('view')} disabled={busy}>
              Keep it
            </Button>
          </div>
        )}
      </div>

      {canChange && !message.deleted && mode === 'view' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Message actions"
              // Visible on hover or keyboard focus, beside the bubble, so the thread stays clean.
              className="size-7 shrink-0 self-end opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={mine ? 'end' : 'start'}>
            {canEdit && (
              <DropdownMenuItem
                onSelect={() => {
                  setDraft(message.body ?? '');
                  setMode('edit');
                }}
              >
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem tone="danger" onSelect={() => setMode('confirm-delete')}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

/** "@Riya Shah" emphasised for the people the API confirmed as mentioned; other text as typed. */
function highlightMentions(body: string, mentions: Message['mentions'], mine: boolean): ReactNode {
  if (!mentions.length) return body;
  const names = mentions.map((m) => escapeRegExp(`@${m.name}`));
  return body.split(new RegExp(`(${names.join('|')})`, 'g')).map((part, i) =>
    i % 2 === 1 ? (
      <span
        key={i}
        className={cn(
          'rounded-sm px-0.5 font-semibold',
          // Readable on both bubbles: a lighter chip on the ink bubble, a surface chip on the soft one.
          mine ? 'bg-bg/20' : 'bg-surface',
        )}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Your message while it's on its way: shown at once, dimmed, marked "Sending…". */
export function SendingMessage({ body }: { body: string }) {
  return (
    <li className="flex flex-row-reverse px-3 pt-1" aria-live="off">
      <div className="flex max-w-[85%] flex-col items-end gap-0.5">
        <p className="rounded-md bg-ink px-2.5 py-1.5 text-sm leading-5 break-words whitespace-pre-wrap text-bg opacity-60">
          {body}
        </p>
        <span className="px-1 font-mono text-xs text-ink-3">Sending…</span>
      </div>
    </li>
  );
}
