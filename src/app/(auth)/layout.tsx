import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/logo';

/**
 * Sign-in, registration and password screens: one narrow column on the stone ground.
 * No marketing panel or illustration: people come here to get into their work.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col px-4">
      <main className="mx-auto grid w-full max-w-sm flex-1 content-center gap-6 py-12">
        <div className="grid gap-1.5">
          <Logo />
          <p className="text-sm text-ink-3">Bug reporting and QA tracking for Invennico teams.</p>
        </div>
        {children}
      </main>
      <footer className="mx-auto w-full max-w-sm pb-6 text-xs text-ink-3">
        Internal tool. Trouble signing in? Ask your BugTrail admin.
      </footer>
    </div>
  );
}
