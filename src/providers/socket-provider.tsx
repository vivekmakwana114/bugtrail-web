'use client';

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { accessTokenStore, API_URL, refreshAccessToken } from '@/lib/api-client';
import { notificationKeys } from '@/features/notifications/keys';
import { useAuth } from './auth-provider';

/*
 * One Socket.IO connection per tab, open while signed in. Sockets only PUSH (new messages, bug
 * changes, notifications); every change still goes through the REST API. See bugtrail-api
 * src/sockets/index.js for the events.
 *
 * Auth: the handshake carries the in-memory access token. `auth` is a function so every
 * (re)connect sends the current token, not the one from when the tab opened.
 */

type SocketContextValue = { socket: Socket | null; connected: boolean };

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

// Socket.IO lives on the API's origin (http://host:5000), not under its /v1 prefix.
const SOCKET_URL = new URL(API_URL).origin;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // The bell updates the moment a notification is created, instead of on the next poll.
  const onNotification = useEffectEvent(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  });

  useEffect(() => {
    if (status !== 'authenticated') return;

    const s = io(SOCKET_URL, {
      auth: (send) => send({ token: accessTokenStore.get() }),
      transports: ['websocket'],
    });
    // A refused handshake or a server-side kick isn't retried by Socket.IO on its own. Try once
    // with a fresh token; if the session itself is over, the next API call signs the user out.
    let renewing = false;
    const renewAndReconnect = async () => {
      if (renewing) return;
      renewing = true;
      const token = await refreshAccessToken();
      renewing = false;
      if (token) s.connect();
    };

    s.on('connect', () => setConnected(true));
    s.on('disconnect', (reason) => {
      setConnected(false);
      // "io server disconnect": the API cut us off (role or access changed). Anything else is
      // the network, and Socket.IO reconnects by itself.
      if (reason === 'io server disconnect') renewAndReconnect();
    });
    s.on('connect_error', (error) => {
      // "Unauthorized" = the token expired (30 min) while we were disconnected.
      if (error.message === 'Unauthorized') renewAndReconnect();
    });
    s.on('notification:new', () => onNotification());

    // Publishing the socket from the effect that owns its lifetime: subscribe-to-external-system.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s);
    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [status]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

/** The tab's socket (null while signed out or before it's created) and whether it's connected. */
export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
