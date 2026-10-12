'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { projectKeys } from '@/features/projects/hooks';
import * as bugsApi from './api';
import type { BugDetail, BugListFilters } from './types';

export const BUGS_PAGE_SIZE = 50;

export const bugKeys = {
  all: ['bugs'] as const,
  lists: () => [...bugKeys.all, 'list'] as const,
  list: (projectId: string, filters: BugListFilters) =>
    [...bugKeys.lists(), projectId, filters] as const,
  modules: (projectId: string) => [...bugKeys.all, 'modules', projectId] as const,
  /** The bug page is addressed by key (CHK-142), so its cache is too. */
  detail: (bugKey: string) => [...bugKeys.all, 'detail', bugKey] as const,
  activity: (bugKey: string) => [...bugKeys.all, 'activity', bugKey] as const,
  /** Mutation key, so the live "bug deleted" event can tell our own delete from someone else's. */
  deleteMutation: (bugId: string) => [...bugKeys.all, 'delete', bugId] as const,
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

/**
 * Report a bug. A new bug changes the grid, the project's counts (header, Overview, the projects
 * grid's cards) and maybe the module list, so all of those refetch.
 */
export function useCreateBug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bugsApi.createBug,
    onSuccess: (bug) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: bugKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: bugKeys.modules(bug.project.id) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(bug.project.id) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
      ]),
  });
}

export function useBug(bugKey: string) {
  return useQuery({ queryKey: bugKeys.detail(bugKey), queryFn: () => bugsApi.getBug(bugKey) });
}

export function useBugActivity(bugKey: string) {
  return useQuery({
    queryKey: bugKeys.activity(bugKey),
    queryFn: () => bugsApi.getBugActivity(bugKey),
  });
}

/**
 * After any change to a bug: the API answered with the new detail, so the page updates without a
 * refetch. The timeline, the grid rows and the project's counts are stale now, so they refetch.
 */
function onBugChanged(queryClient: QueryClient, bug: BugDetail) {
  queryClient.setQueryData(bugKeys.detail(bug.key), bug);
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: bugKeys.activity(bug.key) }),
    queryClient.invalidateQueries({ queryKey: bugKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: bugKeys.modules(bug.project.id) }),
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(bug.project.id) }),
    queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
  ]);
}

/**
 * A refused change usually means this page is out of date: 409 (someone changed it between our
 * read and our write), 400 "already resolved", 403 "you can't move it from X" (it moved, or you
 * were unassigned). Reload the bug either way, so the page shows what's true and the user can
 * decide again. Cheap, and harmless when the error was something else.
 */
function refetchBug(queryClient: QueryClient, bugKey: string) {
  return queryClient.invalidateQueries({ queryKey: bugKeys.detail(bugKey) });
}

/** Status, assignee and content each have their own endpoint; the cache handling is shared. */
function useBugMutation<TInput>(
  bug: BugDetail,
  request: (bugId: string, input: TInput) => Promise<BugDetail>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => request(bug.id, input),
    onSuccess: (updated) => onBugChanged(queryClient, updated),
    onError: () => refetchBug(queryClient, bug.key),
  });
}

export const useChangeBugStatus = (bug: BugDetail) => useBugMutation(bug, bugsApi.changeBugStatus);
export const useAssignBug = (bug: BugDetail) => useBugMutation(bug, bugsApi.assignBug);
export const useUpdateBug = (bug: BugDetail) => useBugMutation(bug, bugsApi.updateBug);

export function useDeleteBug(bug: BugDetail) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: bugKeys.deleteMutation(bug.id),
    mutationFn: () => bugsApi.deleteBug(bug.id),
    onSuccess: () => {
      // Mark stale, don't remove: removing while the bug page is still mounted makes it refetch
      // at once (a pointless 404). Coming Back to it refetches and shows "isn't available".
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: bugKeys.detail(bug.key), refetchType: 'none' }),
        queryClient.invalidateQueries({ queryKey: bugKeys.activity(bug.key), refetchType: 'none' }),
        queryClient.invalidateQueries({ queryKey: bugKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(bug.project.id) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
      ]);
    },
  });
}
