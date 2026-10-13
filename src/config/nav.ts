import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { routes } from './routes';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown only when the user's role has this permission. Leave it out for everyone's items. */
  permission?: string;
};

/**
 * Sidebar items, in order. An item is added here in the same change that builds its screen,
 * so the sidebar never links to a page that doesn't exist yet.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: routes.dashboard,
    icon: LayoutDashboard,
    permission: 'dashboard:view',
  },
  { label: 'Projects', href: routes.projects, icon: FolderKanban, permission: 'project:read' },
  { label: 'Users', href: routes.users, icon: Users, permission: 'user:read' },
  // GET /roles is open to any signed-in user; the screen is for the people who assign roles.
  { label: 'Roles', href: routes.roles, icon: ShieldCheck, permission: 'user:read' },
  // Everyone has a bell, so everyone has the page (the API scopes it to your own notifications).
  { label: 'Notifications', href: routes.notifications, icon: Bell },
];
