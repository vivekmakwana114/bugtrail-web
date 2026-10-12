/** Every path the app links to, so a renamed route is a one-line change. */
export const routes = {
  home: '/projects',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  pendingApproval: '/pending-approval',
  dashboard: '/dashboard',
  projects: '/projects',
  project: (projectId: string) => `/projects/${projectId}`,
  bug: (projectId: string, bugKey: string) => `/projects/${projectId}/bugs/${bugKey}`,
} as const;

/**
 * Where to go after signing in. `next` comes from the URL, so it's untrusted: only same-site
 * paths are allowed. "//evil.com" and "/\evil.com" are protocol-relative URLs to another site,
 * and anything not starting with "/" ("javascript:...", "https://...") is rejected outright.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return routes.home;
  }
  return next;
}
