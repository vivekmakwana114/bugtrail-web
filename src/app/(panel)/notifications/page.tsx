import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NotificationsPage } from '@/features/notifications/components/notifications-page';

export const metadata: Metadata = { title: 'Notifications · BugTrail' };

// Rendered only after the browser-side session check: see (panel)/layout.tsx.
export const instant = false;

export default function Page() {
  return (
    // The tab (?show=unread) is request data, so it's read inside Suspense.
    <Suspense>
      <NotificationsPage />
    </Suspense>
  );
}
