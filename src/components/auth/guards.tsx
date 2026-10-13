'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { homePathFor, routes, safeNextPath } from '@/config/routes';
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

  useEffect(() => {
    if (status === 'anonymous') {
      // Read the URL here (browser only) rather than with usePathname(): this guard wraps dynamic
      // routes like /projects/[projectId], whose path can't be known while prerendering.
      const { pathname, search } = window.location;
      router.replace(`${routes.login}?next=${encodeURIComponent(pathname + search)}`);
    }
  }, [status, router]);

  return status === 'authenticated' ? children : <SessionPending />;
}

/**
 * For login/register/forgot-password: once signed in (already, or by submitting the form), go
 * to the page the user was heading for (?next=), or their home page (by role). This is the ONLY
 * place that navigates after sign-in, so the form just signs in and this follows.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const role = user?.role ?? null;

  useEffect(() => {
    if (status === 'authenticated') {
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(safeNextPath(next, homePathFor(role)));
    }
  }, [status, role, router]);

  return status === 'anonymous' ? children : <SessionPending />;
}

/**
 * For "/", which has no page of its own. Home depends on the role, and only the browser knows
 * the session, so this waits for it: signed in → your home page, signed out → sign in.
 */
export function GoToHome() {
  const { status, user } = useAuth();
  const router = useRouter();
  const role = user?.role ?? null;

  useEffect(() => {
    if (status === 'authenticated') router.replace(homePathFor(role));
    if (status === 'anonymous') router.replace(routes.login);
  }, [status, role, router]);

  return <SessionPending />;
}
