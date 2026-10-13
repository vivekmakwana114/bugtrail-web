import type { RoleKey } from '@/types/api';

/** Display names for the four fixed roles (the API defines what each can do). */
export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  developer: 'Developer',
  qa: 'QA',
};

/** One line per role, the same words as the API's role catalog (src/config/roles.js). */
export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  admin: 'Full access. Manages users and every project.',
  project_manager: 'Runs projects and their members, triages and assigns bugs.',
  developer: 'Works on assigned bugs: Reported → Ongoing → Resolved.',
  qa: 'Reports bugs and verifies fixes (Pass / Failed).',
};

export function roleLabel(role: RoleKey | null): string {
  return role ? ROLE_LABELS[role] : 'No role yet';
}
