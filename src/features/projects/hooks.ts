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
  detail: (projectId: string) => [...projectKeys.all, 'detail', projectId] as const,
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

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.getProject(projectId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      return queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
