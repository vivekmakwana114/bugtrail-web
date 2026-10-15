'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import * as chatApi from './api';
import type { ChatMessage, MessagePage } from './types';

export const chatKeys = {
  all: ['chat'] as const,
  messages: (bugId: string) => [...chatKeys.all, 'messages', bugId] as const,
};

type Thread = InfiniteData<MessagePage, string | undefined>;

/**
 * The bug's chat. Page 1 is the latest 30; each further page is older (cursor = `before`).
 * Messages don't go stale on their own: new ones arrive through the socket (see useBugRoom).
 * Polling while the socket is down is only the fallback, like the notification bell.
 */
export function useMessages(bugId: string) {
  const { connected } = useSocket();
  return useInfiniteQuery({
    queryKey: chatKeys.messages(bugId),
    queryFn: ({ pageParam }) => chatApi.getMessages(bugId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: Infinity,
    refetchInterval: connected ? false : 15_000,
  });
}

/** Oldest first, across every loaded page: what the panel renders top to bottom. */
export function flattenThread(
  thread: InfiniteData<MessagePage, unknown> | undefined,
): ChatMessage[] {
  return thread ? [...thread.pages].reverse().flatMap((page) => page.messages) : [];
}

/*
 * The thread is updated in place instead of refetched: a send, an edit, a delete or a socket
 * event each touch one message. Every message can arrive twice (our own POST's response and the
 * room broadcast), so both paths go through the same upsert keyed by id.
 */

/**
 * Replace the message if it's loaded, otherwise add it to the newest page in time order. Sends
 * can overlap, so their answers may arrive out of order: sorting keeps the thread chronological.
 */
export function upsertMessage(queryClient: QueryClient, message: ChatMessage) {
  queryClient.setQueryData<Thread>(chatKeys.messages(message.bugId), (thread) => {
    if (!thread) return thread;
    const exists = thread.pages.some((page) => page.messages.some((m) => m.id === message.id));
    const pages = exists
      ? thread.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => (m.id === message.id ? message : m)),
        }))
      : thread.pages.map((page, i) =>
          i === 0
            ? {
                ...page,
                messages: [...page.messages, message].sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                ),
              }
            : page,
        );
    return { ...thread, pages };
  });
}

/** Turn a message into the tombstone the API now returns for it. */
export function markMessageDeleted(queryClient: QueryClient, bugId: string, messageId: string) {
  queryClient.setQueryData<Thread>(chatKeys.messages(bugId), (thread) =>
    thread
      ? {
          ...thread,
          pages: thread.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === messageId ? { ...m, body: null, mentions: [], deleted: true } : m,
            ),
          })),
        }
      : thread,
  );
}

export function useSendMessage(bugId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; mentions: string[] }) => chatApi.sendMessage(bugId, input),
    onSuccess: (message) => upsertMessage(queryClient, message),
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      chatApi.editMessage(messageId, body),
    onSuccess: (message) => upsertMessage(queryClient, message),
  });
}

export function useDeleteMessage(bugId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.deleteMessage,
    onSuccess: (_, messageId) => markMessageDeleted(queryClient, bugId, messageId),
  });
}
