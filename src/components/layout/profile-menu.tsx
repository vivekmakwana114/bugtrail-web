'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { routes } from '@/config/routes';
import { roleLabel } from '@/config/roles';
import { useAuth } from '@/providers/auth-provider';

/** Who you are, the theme switch, and sign out. Profile editing joins this menu later. */
export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const onSignOut = async () => {
    await signOut();
    router.replace(routes.login);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-sunken"
        aria-label={`Account: ${user.name}`}
      >
        <Avatar name={user.name} src={user.avatarUrl} />
        <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="grid gap-0.5 px-2 py-1.5">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-ink-3">{user.email}</span>
          <span className="text-xs text-ink-2">{roleLabel(user.role)}</span>
        </div>
        <DropdownMenuSeparator />
        <div className="grid gap-1.5 px-2 py-1.5">
          <span className="text-xs text-ink-3">Theme</span>
          <ThemeToggle className="w-full [&>button]:flex-1" />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
