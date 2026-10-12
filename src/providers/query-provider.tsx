'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getErrorStatus } from '@/lib/api-client';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retrying a 4xx (validation, 403, 404) gives the same answer; retry only network/5xx, once.
        retry: (failureCount, error) => {
          const status = getErrorStatus(error);
          return failureCount < 1 && (status === undefined || status >= 500);
        },
        refetchOnWindowFocus: true,
      },
    },
  });
}

/** One QueryClient per browser tab (created once, not on every render). */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
