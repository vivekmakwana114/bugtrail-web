'use client';

import { useEffect, useEffectEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { routes } from '@/config/routes';
import { projectKeys } from '@/features/projects/hooks';
import { chatKeys, markMessageDeleted, upsertMessage } from '@/features/chat/hooks';
import type { ChatMessage } from '@/features/chat/types';
import { useSocket } from '@/providers/socket-provider';
import { bugKeys } from './hooks';
import type { BugDetail } from './types';

/** What the API broadcasts after any change (deliberately small: allowed moves differ per viewer). */
type BugUpdatedEvent = {
  id: string;
  key: string;
  updatedAt: string;
  deleted?: boolean;
};

/**
 * Live updates while a bug page is open: join the bug's room, and turn its events into cache
 * updates. Rejoins after every reconnect (rooms don't survive a dropped connection) and then
 * refetches, so nothing that happened while offline is missed.
 */
export function useBugRoom(bug: BugDetail) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const router = useRouter();

  const refreshBug = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bugKeys.detail(bug.key) }),
      queryClient.invalidateQueries({ queryKey: bugKeys.activity(bug.key) }),
      queryClient.invalidateQueries({ queryKey: bugKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(bug.project.id) }),
    ]);

  const onBugUpdated = useEffectEvent((event: BugUpdatedEvent) => {
    if (event.id !== bug.id) return;
    if (event.deleted) {
      // Our own delete: its dialog already toasts and navigates. Refetching here would only
      // fetch the bug we just deleted (two pointless 404s).
      if (queryClient.getMutationCache().find({ mutationKey: bugKeys.deleteMutation(bug.id) })) {
        return;
      }
      // Someone else deleted it while we were looking: say so and go back to the project.
      toast.info(`${event.key} was deleted by someone else`);
      queryClient.invalidateQueries({ queryKey: bugKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(bug.project.id) });
      router.replace(routes.project(bug.project.id));
      return;
    }
    // Our own change already put this exact version in the cache: nothing to fetch.
    const cached = queryClient.getQueryData<BugDetail>(bugKeys.detail(bug.key));
    if (cached?.updatedAt === event.updatedAt) return;
    refreshBug();
  });

  const onMessage = useEffectEvent((message: ChatMessage) => {
    if (message.bugId === bug.id) upsertMessage(queryClient, message);
  });
  const onMessageDeleted = useEffectEvent((event: { id: string; bugId: string }) => {
    if (event.bugId === bug.id) markMessageDeleted(queryClient, bug.id, event.id);
  });
  const onRejoined = useEffectEvent(() => {
    refreshBug();
    queryClient.invalidateQueries({ queryKey: chatKeys.messages(bug.id) });
  });

  useEffect(() => {
    if (!socket) return;
    let joinedBefore = false;
    const join = () => {
      socket.emit('bug:join', bug.id, (ack: { ok: boolean }) => {
        if (ack.ok && joinedBefore) onRejoined();
        joinedBefore ||= ack.ok;
      });
    };
    // Effect events are only called from here, never handed to the socket directly.
    const listeners = {
      'bug:updated': (event: BugUpdatedEvent) => onBugUpdated(event),
      'message:new': (message: ChatMessage) => onMessage(message),
      'message:updated': (message: ChatMessage) => onMessage(message),
      'message:deleted': (event: { id: string; bugId: string }) => onMessageDeleted(event),
    };
    if (socket.connected) join();
    socket.on('connect', join);
    Object.entries(listeners).forEach(([event, listener]) => socket.on(event, listener));
    return () => {
      socket.off('connect', join);
      Object.entries(listeners).forEach(([event, listener]) => socket.off(event, listener));
      socket.emit('bug:leave', bug.id);
    };
  }, [socket, bug.id]);
}
