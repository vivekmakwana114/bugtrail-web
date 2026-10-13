import type { RoleKey } from '@/types/api';

/** Display names for the fixed roles (the API defines what each can do). Order = picker order. */
export const ROLE_LABELS: Record<RoleKey, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  developer: 'Developer',
  ui_ux: 'UI/UX',
  qa: 'QA',
};

/** One line per role, the same words as the API's role catalog (src/config/roles.js). */
export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  admin: 'Full access. Manages users and every project.',
  project_manager: 'Runs projects and their members, triages and assigns bugs.',
  developer: 'Works on assigned bugs: Reported → Ongoing → Resolved.',
  ui_ux: 'Works on assigned design and UI bugs: Reported → Ongoing → Resolved.',
  qa: 'Reports bugs and verifies fixes (Pass / Failed).',
};

export function roleLabel(role: RoleKey | null): string {
  return role ? ROLE_LABELS[role] : 'No role yet';
}

/**
 * The role with the person's designation, when they have one: "Developer · MERN Developer".
 * The designation is free text set by an Admin; the role alone decides what they can do.
 */
export function roleWithDesignation(role: RoleKey | null, designation?: string | null): string {
  const title = designation?.trim();
  return title ? `${roleLabel(role)} · ${title}` : roleLabel(role);
}
