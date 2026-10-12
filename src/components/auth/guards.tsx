'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { routes, safeNextPath } from '@/config/routes';
import { Logo } from '@/components/shared/logo';

/**
 * Client-side guards. The web server can't see the session (the refresh cookie belongs to the
 * API's domain), so these decide after the session check. They protect the UI, not the data:
 * the API rejects every request without a valid token anyway.
 */

/** Shown while the session is being restored: the logo, not a blank page or a spinner. */
function SessionPending() {
  return (
    <div className="grid flex-1 place-items-center" aria-busy="true" aria-label="Signing you in">
      <Logo className="opacity-60 motion-safe:animate-pulse" />
    </div>
  );
}

/** For the panel: signed-out users go to /login and come back here afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      const search = typeof window === 'undefined' ? '' : window.location.search;
      router.replace(`${routes.login}?next=${encodeURIComponent(pathname + search)}`);
    }
  }, [status, router, pathname]);

  return status === 'authenticated' ? children : <SessionPending />;
}

/**
 * For login/register/forgot-password: once signed in (already, or by submitting the form), go
 * to the page the user was heading for (?next=), or the home page. This is the ONLY place that
 * navigates after sign-in, so the form just signs in and this follows.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(safeNextPath(next));
    }
  }, [status, router]);

  return status === 'anonymous' ? children : <SessionPending />;
}
