import { FolderKanban, type LucideIcon } from 'lucide-react';
import { routes } from './routes';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown only when the user's role has this permission. */
  permission: string;
};

/**
 * Sidebar items, in order. An item is added here in the same change that builds its screen,
 * so the sidebar never links to a page that doesn't exist yet.
 * Coming with their screens: Dashboard (dashboard:view), Users (user:read), Roles, Notifications.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Projects', href: routes.projects, icon: FolderKanban, permission: 'project:read' },
];
