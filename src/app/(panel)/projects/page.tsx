import type { Metadata } from 'next';
import { SignedInPlaceholder } from './signed-in-placeholder';

export const metadata: Metadata = { title: 'Projects · BugTrail' };

// Temporary: proves the sign-in flow end to end. Replaced by the projects grid in the next step.
export default function ProjectsPage() {
  return <SignedInPlaceholder />;
}
