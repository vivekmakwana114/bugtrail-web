import { api } from '@/lib/api-client';
import type { BugStatus, Page } from '@/types/api';
import type {
  BugActivityItem,
  BugAttachment,
  BugDetail,
  BugListFilters,
  BugListItem,
} from './types';

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

export type CreateBugInput = {
  project: string;
  title: string;
  moduleName: string;
  description: string;
  attachments: BugAttachment[];
  status: BugStatus;
  assignee: string | null;
  sendEmail: boolean;
};

export async function createBug(input: CreateBugInput): Promise<BugDetail> {
  const { data } = await api.post<BugDetail>('/bugs', input);
  return data;
}

/** By id or by key (CHK-142): the bug page URL uses the key. */
export async function getBug(bugRef: string): Promise<BugDetail> {
  const { data } = await api.get<BugDetail>(`/bugs/${bugRef}`);
  return data;
}

export async function getBugActivity(bugRef: string): Promise<BugActivityItem[]> {
  const { data } = await api.get<{ activity: BugActivityItem[] }>(`/bugs/${bugRef}/activity`);
  return data.activity;
}

export async function changeBugStatus(
  bugId: string,
  input: { status: BugStatus; sendEmail: boolean },
): Promise<BugDetail> {
  const { data } = await api.patch<BugDetail>(`/bugs/${bugId}/status`, input);
  return data;
}

export async function assignBug(
  bugId: string,
  input: { assignee: string | null; sendEmail: boolean },
): Promise<BugDetail> {
  const { data } = await api.patch<BugDetail>(`/bugs/${bugId}/assign`, input);
  return data;
}

export async function updateBug(
  bugId: string,
  input: Pick<BugDetail, 'title' | 'moduleName' | 'description' | 'attachments'>,
): Promise<BugDetail> {
  const { data } = await api.patch<BugDetail>(`/bugs/${bugId}`, input);
  return data;
}

export async function deleteBug(bugId: string): Promise<void> {
  await api.delete(`/bugs/${bugId}`);
}
