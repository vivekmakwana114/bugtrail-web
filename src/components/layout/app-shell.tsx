import type { ReactNode } from 'react';
import { Logo } from '@/components/shared/logo';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { HomeLink } from './home-link';
import { MobileNav } from './mobile-nav';
import { ProfileMenu } from './profile-menu';
import { SidebarNav } from './sidebar-nav';

/**
 * The panel frame: a quiet sidebar on the left (from 1024px), a thin top bar with the bell and
 * the profile menu, and the page. The chrome stays neutral so the content (statuses, the Trail)
 * carries the colour.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-3 focus:py-1.5 focus:text-sm focus:text-bg"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col gap-6 border-r border-line bg-surface px-3 py-4 lg:flex">
        <HomeLink className="px-1.5">
          <Logo />
        </HomeLink>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-line bg-bg px-4 lg:px-8">
          <MobileNav />
          <HomeLink className="lg:hidden">
            <Logo withWordmark={false} />
          </HomeLink>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>
        <main
          id="content"
          tabIndex={-1}
          className="mx-auto grid w-full max-w-6xl content-start gap-6 px-4 py-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
