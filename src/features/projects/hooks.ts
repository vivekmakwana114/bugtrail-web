'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ProjectStatus } from '@/types/api';
import * as projectsApi from './api';

export const PROJECTS_PAGE_SIZE = 24;

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: { status?: ProjectStatus; search?: string }) =>
    [...projectKeys.lists(), filters] as const,
  /** By project key (BT), the same value the URL carries. */
  detail: (projectKey: string) => [...projectKeys.all, 'detail', projectKey] as const,
  managerCandidates: () => [...projectKeys.all, 'manager-candidates'] as const,
};

/**
 * The projects grid, a page of cards at a time ("Show more"). While a new filter loads, the
 * previous cards stay on screen instead of flashing to a skeleton.
 */
export function useProjectList(filters: { status?: ProjectStatus; search?: string }) {
  return useInfiniteQuery({
    queryKey: projectKeys.list(filters),
    queryFn: ({ pageParam }) =>
      projectsApi.getProjects({ ...filters, page: pageParam, limit: PROJECTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

/**
 * One project, addressed by its key from the URL (BT). An old-style id still loads (the API
 * accepts both) and the page then rewrites the URL to the key. Keys are cached uppercase, so
 * /projects/bt and /projects/BT share one cache entry, and every invalidation uses the key.
 */
export function useProject(projectRef: string) {
  const ref = /^[0-9a-f]{24}$/i.test(projectRef) ? projectRef : projectRef.toUpperCase();
  return useQuery({
    queryKey: projectKeys.detail(ref),
    queryFn: () => projectsApi.getProject(ref),
  });
}

/** Who can be picked as manager in the edit dialog; only fetched while it's open. */
export function useManagerCandidates(enabled: boolean) {
  return useQuery({
    queryKey: projectKeys.managerCandidates(),
    queryFn: projectsApi.getManagerCandidates,
    staleTime: 5 * 60_000,
    enabled,
  });
}

/** Save the edit dialog. The detail is replaced with the response; lists refetch (name, status). */
export function useUpdateProject(target: { id: string; key: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof projectsApi.updateProject>[1]) =>
      projectsApi.updateProject(target.id, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(target.key), project);
      return queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.key), project);
      return queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
