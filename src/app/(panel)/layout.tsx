import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth/guards';

/**
 * Everything behind sign-in. The sidebar + topbar layout arrives in the next Phase 7 step;
 * for now this is only the guard, so the sign-in flow can be used end to end.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-6 px-4 py-8">
        {children}
      </div>
    </RequireAuth>
  );
}
