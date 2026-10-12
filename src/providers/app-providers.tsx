'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { SocketProvider } from './socket-provider';

/**
 * Client-side providers for the whole app. Order matters: auth clears the query cache on sign-out,
 * and the socket opens and closes with the session.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>{children}</SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
