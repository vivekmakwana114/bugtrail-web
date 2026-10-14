import { api } from '@/lib/api-client';
import type { Page, ProjectDetail, ProjectPage, ProjectStatus, UserSummary } from '@/types/api';

export type ProjectListParams = {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getProjects(params: ProjectListParams): Promise<ProjectPage> {
  const { data } = await api.get<ProjectPage>('/projects', {
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
  // A PATCH: send only what changes (the card's status menu sends just `status`).
  input: Partial<{
    name: string;
    description: string;
    status: ProjectStatus;
    manager: string | null;
  }>,
): Promise<ProjectDetail> {
  const { data } = await api.patch<ProjectDetail>(`/projects/${projectId}`, input);
  return data;
}

/**
 * Everyone who can join a project: active users with a role (the API refuses pending,
 * suspended and rejected accounts). Only people with project:manage_members (PM, Admin) open
 * the picker, and both can read the user list. One page of 100 is plenty for one team.
 */
export async function getMemberCandidates(): Promise<UserSummary[]> {
  const { data } = await api.get<Page<UserSummary>>('/users', {
    params: { status: 'active', sortBy: 'name:asc', limit: 100 },
  });
  return data.results.filter((user) => user.role !== null);
}

/** Adds people (already-members are fine: the API skips them). Returns the new member list. */
export async function addProjectMembers(
  projectId: string,
  userIds: string[],
): Promise<UserSummary[]> {
  const { data } = await api.post<{ members: UserSummary[] }>(`/projects/${projectId}/members`, {
    userIds,
  });
  return data.members;
}

/**
 * Removes one person. The API refuses for the manager, and for anyone who still has open bugs
 * assigned here (409, "Reassign them first"), so open work never quietly loses its owner.
 */
export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<UserSummary[]> {
  const { data } = await api.delete<{ members: UserSummary[] }>(
    `/projects/${projectId}/members/${userId}`,
  );
  return data.members;
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
