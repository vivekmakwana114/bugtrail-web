import { api } from '@/lib/api-client';
import type { Page, ProjectDetail, ProjectListItem, ProjectStatus } from '@/types/api';

export type ProjectListParams = {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getProjects(params: ProjectListParams): Promise<Page<ProjectListItem>> {
  const { data } = await api.get<Page<ProjectListItem>>('/projects', {
    params: { sortBy: 'name:asc', ...params },
  });
  return data;
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const { data } = await api.get<ProjectDetail>(`/projects/${projectId}`);
  return data;
}

export async function createProject(input: {
  name: string;
  key: string;
  description?: string;
}): Promise<ProjectDetail> {
  const { data } = await api.post<ProjectDetail>('/projects', input);
  return data;
}
