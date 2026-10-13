'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/components/auth/can';
import { getErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { useSocket } from '@/providers/socket-provider';
import type { UserSummary } from '@/types/api';
import {
  flattenThread,
  useDeleteMessage,
  useEditMessage,
  useMessages,
  useSendMessage,
} from '../hooks';
import { ChatComposer } from './chat-composer';
import { ChatMessage } from './chat-message';

/** Messages from the same person this close together read as one block. */
const GROUP_WITHIN_MS = 5 * 60_000;
/** "Near the bottom": close enough that a new message should scroll into view. */
const NEAR_BOTTOM_PX = 80;

type ChatPanelProps = {
  bugId: string;
  /** Project members: who can be mentioned. */
  members: UserSummary[];
  /** Archived projects: read the history, nothing new. */
  readOnly: boolean;
};

/**
 * The bug's conversation. New messages arrive live (useBugRoom on the bug page writes them into
 * the cache); this panel only renders the thread and keeps the scroll position sensible.
 */
export function ChatPanel({ bugId, members, readOnly }: ChatPanelProps) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const canSend = usePermission('chat:send') && !readOnly;
  const thread = useMessages(bugId);
  const send = useSendMessage(bugId);
  const edit = useEditMessage();
  const remove = useDeleteMessage(bugId);
  const messages = flattenThread(thread.data);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const previous = useRef<{ first?: string; last?: string; height: number }>({ height: 0 });
  const [unseen, setUnseen] = useState(false);

  /*
   * After every render, compare the thread's ends with last time:
   *   first render         → start at the bottom (latest messages)
   *   older page prepended → keep the same messages in view (shift by the added height)
   *   new message appended → follow it if the reader was at the bottom or sent it; else show a pill
   */
  const firstId = messages[0]?.id;
  const lastId = messages.at(-1)?.id;
  const lastSenderId = messages.at(-1)?.sender?.id;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = previous.current;
    if (prev.last === undefined) {
      el.scrollTop = el.scrollHeight;
    } else if (firstId !== prev.first && lastId === prev.last) {
      el.scrollTop += el.scrollHeight - prev.height;
    } else if (lastId !== prev.last) {
      if (nearBottom.current || lastSenderId === user?.id) el.scrollTop = el.scrollHeight;
      else setUnseen(true);
    }
    previous.current = { first: firstId, last: lastId, height: el.scrollHeight };
  }, [firstId, lastId, lastSenderId, user?.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom.current && unseen) setUnseen(false);
  };
  const jumpToLatest = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    setUnseen(false);
  };

  /** Each action reports failure in a toast and tells the caller whether to clear its input. */
  const attempt = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
      return true;
    } catch (error) {
      toast.error(failure, { description: getErrorMessage(error) });
      return false;
    }
  };

  const mentionable = members.filter((m) => m.status === 'active' && m.role && m.id !== user?.id);

  // Screen readers hear the newest message from someone else, not the whole list on every
  // render (loading 30 older messages shouldn't read them all out).
  const latest = messages.at(-1);
  const announcement =
    latest && !latest.deleted && latest.sender?.id !== user?.id
      ? `New message from ${latest.sender?.name ?? 'someone'}: ${latest.body}`
      : '';

  return (
    // Fills its container: the bug page gives Chat and Activity one shared height.
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h2 className="text-md font-semibold">Chat</h2>
        <p className="sr-only" role="status">
          {announcement}
        </p>
        {!connected && (
          <span className="text-xs text-ink-3" role="status">
            Reconnecting… new messages will appear when it&apos;s back.
          </span>
        )}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto pb-3"
          aria-busy={thread.isPending}
        >
          {thread.isPending ? (
            <div className="grid gap-4 p-3" aria-label="Loading messages">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : thread.isError ? (
            <div className="grid justify-items-start gap-2 p-3 text-sm text-ink-2">
              The messages didn&apos;t load: {getErrorMessage(thread.error)}
              <Button size="sm" onClick={() => thread.refetch()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <p className="p-3 text-sm text-ink-3">
              No messages yet.{' '}
              {canSend &&
                'Ask a question, share what you found, or @mention someone to bring them in.'}
            </p>
          ) : (
            <>
              {thread.hasNextPage && (
                <div className="flex justify-center pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => thread.fetchNextPage()}
                    disabled={thread.isFetchingNextPage}
                  >
                    {thread.isFetchingNextPage ? 'Loading…' : 'Load earlier messages'}
                  </Button>
                </div>
              )}
              <ol aria-label="Messages">
                {messages.map((message, i) => {
                  const before = messages[i - 1];
                  const continued =
                    !!before &&
                    !before.deleted &&
                    before.sender?.id === message.sender?.id &&
                    new Date(message.createdAt).getTime() - new Date(before.createdAt).getTime() <
                      GROUP_WITHIN_MS;
                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      continued={continued}
                      canChange={canSend && message.sender?.id === user?.id}
                      onEdit={(body) =>
                        attempt(
                          () => edit.mutateAsync({ messageId: message.id, body }),
                          "Couldn't save the edit",
                        )
                      }
                      onDelete={() =>
                        attempt(() => remove.mutateAsync(message.id), "Couldn't delete it")
                      }
                    />
                  );
                })}
              </ol>
            </>
          )}
        </div>
        {unseen && (
          <Button
            size="sm"
            variant="primary"
            onClick={jumpToLatest}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-pop"
          >
            <ArrowDown aria-hidden />
            New messages
          </Button>
        )}
      </div>

      {canSend ? (
        <ChatComposer
          members={mentionable}
          pending={send.isPending}
          onSend={(input) => attempt(() => send.mutateAsync(input), "Couldn't send the message")}
        />
      ) : (
        <p className="border-t border-line p-3 text-sm text-ink-3">
          {readOnly
            ? 'This project is archived, so its chat is read-only.'
            : "Your role can read this chat but can't post in it."}
        </p>
      )}
    </div>
  );
}
