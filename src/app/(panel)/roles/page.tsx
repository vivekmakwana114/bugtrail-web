import type { Metadata } from 'next';
import { RolesPage } from '@/features/roles/components/roles-page';

export const metadata: Metadata = { title: 'Roles · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return <RolesPage />;
}
