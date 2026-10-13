'use client';

import { useQuery } from '@tanstack/react-query';
import * as rolesApi from './api';

export const roleKeys = {
  all: ['roles'] as const,
  catalog: () => [...roleKeys.all, 'catalog'] as const,
};

/**
 * The role catalog lives in the API's code, so it can only change with a deploy (which also
 * reloads the app). Fetched once per session: no refetch on focus or remount.
 */
export function useAccessCatalog({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: roleKeys.catalog(),
    queryFn: rolesApi.getAccessCatalog,
    staleTime: Infinity,
    enabled,
  });
}
