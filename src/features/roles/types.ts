import type { RoleKey } from '@/types/api';

/** One of the four fixed roles, as GET /roles describes it. */
export type RoleDefinition = {
  key: RoleKey;
  label: string;
  description: string;
  /** Permission keys, e.g. 'bug:assign' */
  permissions: string[];
};

/** A section of the permission catalog (Bugs, Users…) with readable labels. */
export type PermissionGroup = {
  key: string;
  label: string;
  permissions: { key: string; label: string }[];
};

/** GET /roles: served from the API's code, so it only changes on deploy. */
export type AccessCatalog = {
  roles: RoleDefinition[];
  permissionGroups: PermissionGroup[];
};
