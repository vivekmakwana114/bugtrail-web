import type { RoleKey } from '@/types/api';

/** Display names for the four fixed roles (the API defines what each can do). */
export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  developer: 'Developer',
  qa: 'QA',
};

export function roleLabel(role: RoleKey | null): string {
  return role ? ROLE_LABELS[role] : 'No role yet';
}
