'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as bugsApi from './api';
import type { BugListFilters } from './types';

export const BUGS_PAGE_SIZE = 50;

export const bugKeys = {
  all: ['bugs'] as const,
  lists: () => [...bugKeys.all, 'list'] as const,
  list: (projectId: string, filters: BugListFilters) =>
    [...bugKeys.lists(), projectId, filters] as const,
  modules: (projectId: string) => [...bugKeys.all, 'modules', projectId] as const,
};

/** The ticket grid: 50 rows at a time. Old rows stay visible while a new filter loads. */
export function useBugList(projectId: string, filters: BugListFilters) {
  return useInfiniteQuery({
    queryKey: bugKeys.list(projectId, filters),
    queryFn: ({ pageParam }) => bugsApi.getBugs(projectId, filters, pageParam, BUGS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useProjectModules(projectId: string) {
  return useQuery({
    queryKey: bugKeys.modules(projectId),
    queryFn: () => bugsApi.getProjectModules(projectId),
    staleTime: 5 * 60_000,
  });
}
