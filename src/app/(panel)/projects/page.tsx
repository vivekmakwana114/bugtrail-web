import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectsPage } from '@/features/projects/components/projects-page';

export const metadata: Metadata = { title: 'Projects · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // ProjectsPage reads its filters from the URL, which needs a Suspense boundary to prerender.
    <Suspense>
      <ProjectsPage />
    </Suspense>
  );
}
