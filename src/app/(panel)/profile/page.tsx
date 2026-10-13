import type { Metadata } from 'next';
import { ProfilePage } from '@/features/profile/components/profile-page';

export const metadata: Metadata = { title: 'Profile · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return <ProfilePage />;
}
