'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/config/nav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

/**
 * The sidebar's links, filtered by permission. The current section gets an ink edge and ink
 * text (the same marker as the grid's cursor row), not a coloured pill.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const items = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <nav aria-label="Main">
      <ul className="grid gap-0.5">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm text-ink-2 hover:bg-sunken hover:text-ink',
                  active && 'bg-sunken font-medium text-ink shadow-cursor',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
