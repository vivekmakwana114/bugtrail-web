import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectOverview } from '@/features/projects/components/project-overview';

export const metadata: Metadata = { title: 'Project · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // The project id is request data (no generateStaticParams), so it's read inside Suspense.
    <Suspense>
      <ProjectOverview />
    </Suspense>
  );
}
