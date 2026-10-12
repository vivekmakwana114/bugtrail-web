import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardPage } from '@/features/dashboard/components/dashboard-page';

export const metadata: Metadata = { title: 'Dashboard · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // The filters (?project, ?range, ?tickets) are request data, so they're read inside Suspense.
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
