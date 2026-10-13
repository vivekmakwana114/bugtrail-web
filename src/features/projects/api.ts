import { api } from '@/lib/api-client';
import type { Page, ProjectDetail, ProjectListItem, ProjectStatus, UserSummary } from '@/types/api';

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

/**
 * Edit a project (project:update): name, description, status, manager. The key never changes.
 * A manager who isn't on the project yet is added as a member by the API.
 */
export async function updateProject(
  projectId: string,
  input: { name: string; description: string; status: ProjectStatus; manager: string | null },
): Promise<ProjectDetail> {
  const { data } = await api.patch<ProjectDetail>(`/projects/${projectId}`, input);
  return data;
}

/**
 * Everyone who could manage a project: active Admins and Project Managers (the roles with
 * project:manage_members, which the API requires of a manager). Only people who can edit a
 * project (PM, Admin) open this, and both can read the user list. One page is plenty for a team.
 */
export async function getManagerCandidates(): Promise<UserSummary[]> {
  const { data } = await api.get<Page<UserSummary>>('/users', {
    params: { status: 'active', sortBy: 'name:asc', limit: 100 },
  });
  return data.results.filter((user) => user.role === 'admin' || user.role === 'project_manager');
}
