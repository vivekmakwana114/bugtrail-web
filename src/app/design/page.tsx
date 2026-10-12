import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesignPreview } from './design-preview';

export const metadata: Metadata = { title: 'Design system · BugTrail' };

/**
 * Living reference for the design system: every token and component in its real states.
 * Development only: 404 in production builds.
 */
export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <DesignPreview />;
}
