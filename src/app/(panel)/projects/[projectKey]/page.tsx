import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectPage } from '@/features/projects/components/project-page';

export const metadata: Metadata = { title: 'Project · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // The project key (/projects/BT) and ?tab= are request data, so they are read inside Suspense.
    <Suspense>
      <ProjectPage />
    </Suspense>
  );
}
