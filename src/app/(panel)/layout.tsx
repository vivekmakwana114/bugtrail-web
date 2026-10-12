import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/guards';
import { AppShell } from '@/components/layout/app-shell';

/*
 * Opt the panel out of Next's instant-navigation validation. Panel pages render only after the
 * session check in the browser (RequireAuth: the session lives in an httpOnly cookie on the API's
 * address, which the Next server can't see), so the server never renders them and the validator
 * reports them as dropped segments. Navigation inside the panel is client-side and still instant.
 */
export const instant = false;

/** Everything behind sign-in: the guard, then the sidebar + top bar frame. */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
