import { api } from '@/lib/api-client';
import type { Page, RoleKey } from '@/types/api';
import type { UserListFilters, UserListItem, UserStatus } from './types';

export async function getUsers(
  filters: UserListFilters,
  page: number,
  limit: number,
): Promise<Page<UserListItem>> {
  const { data } = await api.get<Page<UserListItem>>('/users', {
    params: { ...filters, sortBy: 'name:asc', page, limit },
  });
  return data;
}

/**
 * Approve (active + role), reject, suspend or reactivate. The API owns the allowed transitions:
 * pending → active | rejected, active → suspended, suspended → active, rejected → active.
 */
export async function setUserStatus(
  userId: string,
  input: { status: Exclude<UserStatus, 'pending'>; role?: RoleKey; designation?: string },
): Promise<void> {
  await api.patch(`/users/${userId}/status`, input);
}

/** Role and designation together: the dialog that sets one shows the other. */
export async function changeUserRole(
  userId: string,
  input: { role: RoleKey; designation: string },
): Promise<void> {
  await api.patch(`/users/${userId}`, input);
}

/** Admin-created accounts are active straight away (no approval queue). */
export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: RoleKey;
  designation: string;
}): Promise<void> {
  await api.post('/users', input);
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
}
