import { api } from '@/lib/api-client';
import type { Page } from '@/types/api';
import type { BugListFilters, BugListItem } from './types';

export async function getBugs(
  projectId: string,
  filters: BugListFilters,
  page: number,
  limit: number,
): Promise<Page<BugListItem>> {
  const { data } = await api.get<Page<BugListItem>>('/bugs', {
    params: {
      projectId,
      status: filters.statuses.length ? filters.statuses.join(',') : undefined,
      assignee: filters.assignee,
      moduleName: filters.moduleName,
      search: filters.search,
      sortBy: `${filters.sort.field}:${filters.sort.direction}`,
      page,
      limit,
    },
  });
  return data;
}

/** Module/screen names already used in the project (for the filter and the report form). */
export async function getProjectModules(projectId: string): Promise<string[]> {
  const { data } = await api.get<{ modules: string[] }>(`/projects/${projectId}/modules`);
  return data.modules;
}
