import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BugPage } from '@/features/bugs/components/bug-page';

export const metadata: Metadata = { title: 'Bug · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // The project key and bug key (/projects/BT/bugs/BT-1) are request data, read inside Suspense.
    <Suspense>
      <BugPage />
    </Suspense>
  );
}
