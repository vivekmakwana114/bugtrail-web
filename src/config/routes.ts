import type { RoleKey } from '@/types/api';

/** Every path the app links to, so a renamed route is a one-line change. */
export const routes = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  pendingApproval: '/pending-approval',
  dashboard: '/dashboard',
  projects: '/projects',
  users: '/users',
  roles: '/roles',
  notifications: '/notifications',
  profile: '/profile',
  // Addressed by key (BT, BT-1), never by database id: ids stay out of the address bar.
  project: (projectKey: string) => `/projects/${projectKey}`,
  bug: (projectKey: string, bugKey: string) => `/projects/${projectKey}/bugs/${bugKey}`,
} as const;

/**
 * Your home page, by what your role is for: Admins and Project Managers oversee work, so they
 * land on the dashboard; Developers and QA work tickets, so they land on their projects.
 * A landing choice, not access control: everyone can still open both.
 */
export function homePathFor(role: RoleKey | null): string {
  return role === 'admin' || role === 'project_manager' ? routes.dashboard : routes.projects;
}

/**
 * Where to go after signing in. `next` comes from the URL, so it's untrusted: only same-site
 * paths are allowed. "//evil.com" and "/\evil.com" are protocol-relative URLs to another site,
 * and anything not starting with "/" ("javascript:...", "https://...") is rejected outright.
 * Without a usable `next`, it's the user's home (`fallback`).
 */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback;
  }
  return next;
}
