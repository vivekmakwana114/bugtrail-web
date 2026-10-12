'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { routes } from '@/config/routes';
import { useAuth } from '@/providers/auth-provider';

/** Temporary page behind the guard: shows who is signed in and lets them sign out. */
export function SignedInPlaceholder() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace(routes.login);
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description={user ? `Signed in as ${user.name} (${user.email})` : undefined}
        actions={
          <Button onClick={onSignOut} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        }
      />
      <EmptyState
        title="The projects grid is next"
        description="Sign-in works end to end. The panel layout and the projects grid arrive in the next Phase 7 step."
      />
    </>
  );
}
