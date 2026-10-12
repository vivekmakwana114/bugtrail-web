'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';

/**
 * Show children only if the signed-in user's role has the permission.
 *   <Can permission="project:create"><Button>New project</Button></Can>
 * This hides what a role can't use. It is not security: the API checks every request itself.
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
}

/** Hook form of <Can>, for logic: `const canCreate = usePermission('project:create')` */
export function usePermission(permission: string): boolean {
  return useAuth().hasPermission(permission);
}
