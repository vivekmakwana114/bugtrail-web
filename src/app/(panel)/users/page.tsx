import type { Metadata } from 'next';
import { Suspense } from 'react';
import { UsersPage } from '@/features/users/components/users-page';

export const metadata: Metadata = { title: 'Users · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // The tab and filters (?status, ?role, ?q) are request data, so they're read inside Suspense.
    <Suspense>
      <UsersPage />
    </Suspense>
  );
}
