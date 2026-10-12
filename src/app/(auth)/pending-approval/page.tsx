import type { Metadata } from 'next';
import Link from 'next/link';
import { routes } from '@/config/routes';
import { AuthCard, linkClasses } from '@/features/auth/components/auth-card';

export const metadata: Metadata = { title: 'Waiting for approval · BugTrail' };

/** Where registration lands. Says what happens next and how long it usually takes to hear back. */
export default function PendingApprovalPage() {
  return (
    <AuthCard
      title="Your request is in"
      footer={
        <Link href={routes.login} className={linkClasses}>
          Back to sign in
        </Link>
      }
    >
      <ol className="grid gap-3 text-sm text-ink-2">
        <li className="grid grid-cols-[1.25rem_1fr] gap-2">
          <span className="font-mono text-ink-3">1</span>
          <span>BugTrail admins have been notified that you registered.</span>
        </li>
        <li className="grid grid-cols-[1.25rem_1fr] gap-2">
          <span className="font-mono text-ink-3">2</span>
          <span>
            An admin approves your account and gives you a role: Developer, QA or Project Manager.
          </span>
        </li>
        <li className="grid grid-cols-[1.25rem_1fr] gap-2">
          <span className="font-mono text-ink-3">3</span>
          <span>You get an email when it&apos;s done, and then you can sign in.</span>
        </li>
      </ol>
      <p className="text-xs text-ink-3">
        Waiting a while? Ask your team lead to ping a BugTrail admin.
      </p>
    </AuthCard>
  );
}
