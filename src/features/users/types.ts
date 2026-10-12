import type { RoleKey, UserSummary } from '@/types/api';

export type UserStatus = UserSummary['status'];

/** One row of the users screen (GET /users): the summary plus two dates. */
export type UserListItem = UserSummary & {
  /** null until their first sign-in */
  lastLoginAt: string | null;
  /** when they registered (or an Admin created them) */
  createdAt: string;
};

export type UserListFilters = {
  search?: string;
  role?: RoleKey;
  status?: UserStatus;
};
